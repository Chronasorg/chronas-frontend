/**
 * ProDialog Component
 *
 * "Support Chronas" dialog opened from the PRO star in the sidebar.
 * Non-supporters see the benefits and the three Patreon steps (pledge,
 * check inbox, redeem activation code). Supporters see a thank-you view.
 *
 * Port of PledgeDialog/SubscribeDialog from the classic frontend — Issue #53.
 */

import { useState, useCallback, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { apiClient } from '@/api/client';
import { USERS } from '@/api/endpoints';
import { getApiErrorMessage } from '@/api/errors';
import { useAuthStore } from '@/stores/authStore';
import { isProSubscription } from '@/utils/subscriptionUtils';
import styles from './ProDialog.module.css';

export const PATREON_URL = 'https://www.patreon.com/chronas';
const REWRITE_POST_URL = 'https://www.patreon.com/posts/past-present-and-73703992';

const BENEFITS = ['features', 'noAds', 'development', 'write'] as const;

export interface ProDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Opens the login dialog (redeeming requires an account) */
  onRequestLogin: () => void;
  /** Opens the contact page */
  onRequestContact: () => void;
}

export function ProDialog({ isOpen, ...rest }: ProDialogProps) {
  if (!isOpen) return null;

  // Portal to <body> so the dialog stacks above the timeline portal (z-index 350)
  return createPortal(<ProDialogContent {...rest} />, document.body);
}

function ProDialogContent({
  onClose,
  onRequestLogin,
  onRequestContact,
}: Omit<ProDialogProps, 'isOpen'>) {
  const { t } = useTranslation();
  const subscription = useAuthStore((s) => s.subscription);
  const isPro = isProSubscription(subscription);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      // Keep focus inside the dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, [isPro]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <div
      className={styles['overlay']}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="pro-dialog"
    >
      <div ref={dialogRef} className={styles['dialog']}>
        <button
          type="button"
          className={styles['closeButton']}
          onClick={onClose}
          aria-label={t('pro.close', 'Close')}
          data-testid="pro-dialog-close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <header className={styles['header']}>
          <div className={styles['seal']} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
          <h2 id={titleId} className={styles['title']}>
            {isPro
              ? t('pro.thanksTitle', 'Thank you for your support!')
              : t('pro.title', 'Upgrade Chronas')}
          </h2>
          {!isPro && <p className={styles['subtitle']}>{t('pro.subtitle', 'Pay what you want')}</p>}
        </header>

        <div className={styles['content']}>
          <ul className={styles['benefits']} data-testid="pro-benefits">
            {BENEFITS.map((key) => (
              <li key={key} className={styles['benefit']}>
                <svg
                  className={styles['check']}
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  />
                </svg>
                <div>
                  <div className={styles['benefitTitle']}>{t(`pro.benefits.${key}.title`)}</div>
                  <div className={styles['benefitText']}>
                    {key === 'development' ? (
                      <>
                        {t('pro.benefits.development.textBefore', 'Help shape the')}{' '}
                        <ExternalLink href={REWRITE_POST_URL}>
                          {t('pro.benefits.development.link', 'complete rewrite')}
                        </ExternalLink>
                      </>
                    ) : (
                      t(`pro.benefits.${key}.text`)
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <hr className={styles['divider']} />

          {isPro ? (
            <p className={styles['manage']} data-testid="pro-manage">
              {t('pro.manage', 'You can manage your subscription on')} <PatreonLink autoFocus />
            </p>
          ) : (
            <RedeemSteps onRequestLogin={onRequestLogin} />
          )}

          <p className={styles['help']}>
            {t('pro.help', 'If you have any questions or need help')}{' '}
            <button
              type="button"
              className={styles['inlineLink']}
              onClick={onRequestContact}
              data-testid="pro-contact-link"
            >
              {t('pro.contact', 'Contact Us')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function RedeemSteps({ onRequestLogin }: { onRequestLogin: () => void }) {
  const { t } = useTranslation();
  const { isAuthenticated, userId, setUser } = useAuthStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputId = useId();
  const errorId = useId();

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      const trimmed = code.trim();
      if (!trimmed) return;

      if (!isAuthenticated || !userId) {
        onRequestLogin();
        return;
      }

      setError(null);
      setLoading(true);
      try {
        const response = await apiClient.post<{ token?: string }>(
          USERS.REDEEM_SUBSCRIPTION(userId),
          { code: trimmed }
        );
        if (response.token) {
          // Fresh JWT carries the new subscription claim → dialog flips to thank-you view
          setUser(response.token);
        } else {
          setError(t('pro.errors.generic', 'Something went wrong. Please try again.'));
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError(
            t(
              'pro.errors.unavailable',
              'Redeeming codes is not available right now. Please contact us.'
            )
          );
        } else {
          setError(
            getApiErrorMessage(
              err,
              t('pro.errors.invalid', 'This activation code seems to be incorrect.')
            )
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [code, isAuthenticated, userId, onRequestLogin, setUser, t]
  );

  return (
    <section aria-label={t('pro.stepsTitle', 'Supporting Chronas is quick and easy')}>
      <h3 className={styles['stepsTitle']}>
        {t('pro.stepsTitle', 'Supporting Chronas is quick and easy')}
      </h3>
      <ol className={styles['steps']}>
        <li className={styles['step']}>
          <span className={styles['numeral']} aria-hidden="true">
            I
          </span>
          <div className={styles['stepBody']}>
            {t('pro.step1Before', 'Head over to')} <PatreonLink autoFocus />{' '}
            {t('pro.step1After', 'and pledge an amount of your choice!')}{' '}
            <strong>{t('pro.step1Emphasis', 'Whatever Chronas is worth to you!')}</strong>
          </div>
        </li>
        <li className={styles['step']}>
          <span className={styles['numeral']} aria-hidden="true">
            II
          </span>
          <div className={styles['stepBody']}>{t('pro.step2', 'Check your inbox')}</div>
        </li>
        <li className={styles['step']}>
          <span className={styles['numeral']} aria-hidden="true">
            III
          </span>
          <div className={styles['stepBody']}>
            <form
              className={styles['redeemForm']}
              onSubmit={(e) => void handleSubmit(e)}
              noValidate
            >
              <label htmlFor={inputId}>{t('pro.step3Before', 'Paste the Activation Code')}</label>
              <input
                id={inputId}
                className={styles['codeInput']}
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder={t('pro.codePlaceholder', 'here')}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                disabled={loading}
                data-testid="pro-code-input"
              />
              <span>{t('pro.step3After', 'and hit')}</span>
              <button
                type="submit"
                className={styles['submitButton']}
                disabled={loading || code.trim() === ''}
                data-testid="pro-code-submit"
              >
                {loading ? t('pro.submitting', 'Submitting…') : t('pro.submit', 'Submit')}
              </button>
            </form>
            <div aria-live="polite" className={styles['feedback']}>
              {error && (
                <span
                  id={errorId}
                  className={styles['error']}
                  role="alert"
                  data-testid="pro-code-error"
                >
                  {error}
                </span>
              )}
            </div>
            {!isAuthenticated && (
              <p className={styles['loginNote']} data-testid="pro-login-note">
                {t('pro.loginRequired', 'You need an account to redeem your code.')}{' '}
                <button
                  type="button"
                  className={styles['inlineLink']}
                  onClick={onRequestLogin}
                  data-testid="pro-login-link"
                >
                  {t('pro.login', 'Log in')}
                </button>
              </p>
            )}
          </div>
        </li>
      </ol>
    </section>
  );
}

function PatreonLink({ autoFocus = false }: { autoFocus?: boolean }) {
  return (
    <ExternalLink
      href={PATREON_URL}
      className={styles['patreonLink']}
      autoFocus={autoFocus}
      testId="pro-patreon-link"
    >
      <img
        src="/images/patreon-logo.png"
        alt=""
        width="22"
        height="22"
        className={styles['patreonLogo']}
      />
      Patreon
    </ExternalLink>
  );
}

function ExternalLink({
  href,
  children,
  className,
  autoFocus = false,
  testId,
}: {
  href: string;
  children: React.ReactNode;
  className?: string | undefined;
  autoFocus?: boolean;
  testId?: string | undefined;
}) {
  const { t } = useTranslation();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles['externalLink'] ?? ''} ${className ?? ''}`.trim()}
      data-autofocus={autoFocus || undefined}
      data-testid={testId}
    >
      {children}
      <svg
        className={styles['externalIcon']}
        viewBox="0 0 24 24"
        width="12"
        height="12"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
        />
      </svg>
      <span className={styles['srOnly']}>{t('pro.opensInNewTab', '(opens in a new tab)')}</span>
    </a>
  );
}

export default ProDialog;
