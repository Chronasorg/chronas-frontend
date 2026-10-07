/**
 * SupportDialog Component
 *
 * "Support Chronas" page opened from the heart icon in the sidebar.
 * A single call to action: pledge on Patreon, whatever Chronas is worth to you.
 *
 * Issue #53.
 */

import { useCallback, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { isProSubscription } from '@/utils/subscriptionUtils';
import styles from './SupportDialog.module.css';

export const PATREON_URL = 'https://www.patreon.com/chronas';
export const GITHUB_ISSUES_URL = 'https://github.com/Chronasorg/chronas-frontend/issues';

export interface SupportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Opens the contact page */
  onRequestContact: () => void;
}

export function SupportDialog({ isOpen, ...rest }: SupportDialogProps) {
  if (!isOpen) return null;

  // Portal to <body> so the dialog stacks above the timeline portal (z-index 350)
  return createPortal(<SupportDialogContent {...rest} />, document.body);
}

function SupportDialogContent({ onClose, onRequestContact }: Omit<SupportDialogProps, 'isOpen'>) {
  const { t } = useTranslation();
  const isSupporter = useAuthStore((s) => isProSubscription(s.subscription));
  const dialogRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const titleId = useId();
  const introId = useId();

  useEffect(() => {
    ctaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      // Keep focus inside the dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button');
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

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const newTab = <span className={styles['srOnly']}>{t('support.opensInNewTab')}</span>;

  return (
    <div
      className={styles['overlay']}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={introId}
      data-testid="support-dialog"
    >
      <div ref={dialogRef} className={styles['dialog']}>
        <button
          type="button"
          className={styles['closeButton']}
          onClick={onClose}
          aria-label={t('support.close')}
          data-testid="support-dialog-close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <header className={styles['header']}>
          <div className={styles['seal']} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
              <path d="M1 11h4v11H1zm15-7.75C16.65 2.49 17.66 2 18.7 2 20.55 2 22 3.45 22 5.3c0 2.27-2.91 4.9-6 7.7-3.09-2.81-6-5.44-6-7.7C10 3.45 11.45 2 13.3 2c1.04 0 2.05.49 2.7 1.25zM20 17h-7l-2.09-.73.33-.94L13 16h2.82c.65 0 1.18-.53 1.18-1.18 0-.49-.31-.93-.77-1.11L8.97 11H7v9.02L14 22l8-3c-.01-1.1-.89-2-2-2z" />
            </svg>
          </div>
          <p className={styles['eyebrow']}>{t('support.subtitle')}</p>
          <h2 id={titleId} className={styles['title']}>
            {t('support.title')}
          </h2>
          <p id={introId} className={styles['intro']}>
            {t('support.intro')}
          </p>
        </header>

        {isSupporter && (
          <p className={styles['supporterNote']} data-testid="support-supporter-note">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {t('support.supporter')}
          </p>
        )}

        <section className={styles['pledge']} data-testid="support-pledge">
          <blockquote className={styles['pledgeText']}>
            {t('support.ctaBefore')}{' '}
            <a
              href={PATREON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles['patreonInline']}
              data-testid="support-patreon-link"
            >
              <span className={styles['patreonBadge']} aria-hidden="true">
                <PatreonMark size={12} />
              </span>
              Patreon
              <ExternalIcon />
              {newTab}
            </a>{' '}
            {t('support.ctaAfter')} <strong>{t('support.ctaEmphasis')}</strong>
          </blockquote>

          <a
            ref={ctaRef}
            href={PATREON_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles['ctaButton']}
            data-testid="support-patreon-button"
          >
            <PatreonMark />
            {t('support.button')}
            <ExternalIcon />
            {newTab}
          </a>
        </section>

        <footer className={styles['footer']}>
          <p className={styles['footerTitle']}>{t('support.otherTitle')}</p>
          <div className={styles['footerLinks']}>
            <a
              href={GITHUB_ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles['footerLink']}
              data-testid="support-github-link"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0012 .3" />
              </svg>
              {t('support.github')}
              {newTab}
            </a>
            <p className={styles['help']}>
              {t('support.help')}{' '}
              <button
                type="button"
                className={styles['inlineLink']}
                onClick={onRequestContact}
                data-testid="support-contact-link"
              >
                {t('support.contact')}
              </button>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ExternalIcon() {
  return (
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
  );
}

/** Patreon wordmark glyph (circle + bar) */
function PatreonMark({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <circle cx="15" cy="9.5" r="7" />
      <rect x="2" y="2.5" width="3.5" height="19" />
    </svg>
  );
}

export default SupportDialog;
