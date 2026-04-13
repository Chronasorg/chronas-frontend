/**
 * LoginDialog Component
 *
 * Modal overlay for authentication, matching the old chronas.org login popup.
 * Renders on top of the map so users never lose context.
 * Supports login and signup modes with OAuth buttons.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/api/client';
import { AUTH } from '@/api/endpoints';
import { getApiErrorMessage } from '@/api/errors';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';
import styles from './LoginDialog.module.css';

const API_BASE = env.apiBaseUrl;

const OAUTH_PROVIDERS = [
  { id: 'github', label: 'Github', color: '#333', path: '/auth/login/github' },
  { id: 'google', label: 'Google', color: '#db4437', path: '/auth/login/google' },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', path: '/auth/login/facebook' },
] as const;

export interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const setUser = useAuthStore((s) => s.setUser);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setUsername('');
      setError(null);
      setMode('login');
      // Focus first input after render
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        const normalizedEmail = email.trim().toLowerCase();
        const endpoint = mode === 'login' ? AUTH.LOGIN : AUTH.SIGNUP;
        const body =
          mode === 'login'
            ? { email: normalizedEmail, password }
            : { username, email: normalizedEmail, password };

        const response = await apiClient.post<{ token: string }>(endpoint, body);
        if (response.token) {
          setUser(response.token);
          onClose();
        }
      } catch (err: unknown) {
        const fallback =
          mode === 'login'
            ? 'Login failed. Please check your credentials.'
            : 'Signup failed. Please try again.';
        setError(getApiErrorMessage(err, fallback));
      } finally {
        setLoading(false);
      }
    },
    [email, password, username, mode, setUser, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={styles['overlay']}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Sign into Chronas' : 'Join Chronas'}
      data-testid="login-dialog"
    >
      <div className={styles['card']}>
        <button
          type="button"
          className={styles['closeButton']}
          onClick={onClose}
          aria-label="Close"
          data-testid="login-dialog-close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles['body']}>
          <h2 className={styles['title']}>
            {mode === 'login' ? 'Sign into Chronas' : 'Join Chronas'}
          </h2>

          {/* OAuth — horizontal row like old Chronas */}
          <p className={styles['oauthHeader']}>with one click:</p>
          <div className={styles['oauthRow']}>
            {OAUTH_PROVIDERS.map((p) => (
              <a
                key={p.id}
                href={`${API_BASE}${p.path}`}
                className={styles['oauthButton']}
                style={{ backgroundColor: p.color }}
                data-testid={`login-dialog-oauth-${p.id}`}
              >
                {p.label}
              </a>
            ))}
          </div>

          <div className={styles['divider']}>or</div>

          {error && (
            <div className={styles['error']} role="alert" data-testid="login-dialog-error">
              {error}
            </div>
          )}

          <form className={styles['form']} onSubmit={(e) => void handleSubmit(e)} data-testid="login-dialog-form">
            {mode === 'signup' && (
              <input
                className={styles['input']}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                autoComplete="username"
                data-testid="login-dialog-username"
              />
            )}
            <input
              ref={firstInputRef}
              className={styles['input']}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail"
              required
              autoComplete="email"
              data-testid="login-dialog-email"
            />
            <input
              className={styles['input']}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Password (min 8 characters)' : 'Password'}
              required
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              data-testid="login-dialog-password"
            />
            <button
              type="submit"
              className={styles['submitButton']}
              disabled={loading || !email || !password || (mode === 'signup' && !username)}
              data-testid="login-dialog-submit"
            >
              {loading
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className={styles['footer']}>
            {mode === 'login' ? (
              <>
                <span>
                  Don&apos;t have an account?{' '}
                  <a
                    className={styles['footerLink']}
                    onClick={() => { setMode('signup'); setError(null); }}
                    data-testid="login-dialog-switch-signup"
                  >
                    Join Chronas
                  </a>
                </span>
                <span className={styles['footerLink']}>Forgot password?</span>
              </>
            ) : (
              <span>
                Already have an account?{' '}
                <a
                  className={styles['footerLink']}
                  onClick={() => { setMode('login'); setError(null); }}
                  data-testid="login-dialog-switch-login"
                >
                  Sign In
                </a>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginDialog;
