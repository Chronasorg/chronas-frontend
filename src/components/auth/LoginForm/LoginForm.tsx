/**
 * LoginForm Component
 *
 * Email/password login form with OAuth buttons.
 * Requirements: US-8.1, US-8.2
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { apiClient } from '@/api/client';
import { AUTH } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { OAuthButtons } from '../OAuthButtons/OAuthButtons';
import styles from './LoginForm.module.css';

export interface LoginFormProps {
  onSwitchToSignup?: () => void;
  testId?: string;
}

export function LoginForm({ onSwitchToSignup, testId = 'login-form' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const handleSubmit = useCallback(async (e: Event) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.post<{ token: string }>(AUTH.LOGIN, { email, password });
      if (response.token) {
        setUser(response.token);
        void navigate('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }, [email, password, setUser, navigate]);

  return (
    <div className={styles['container']} data-testid={testId}>
      <h2 className={styles['title']}>Sign In</h2>

      {error && <div className={styles['error']} data-testid="login-error" role="alert">{error}</div>}

      <form className={styles['form']} onSubmit={(e) => { e.preventDefault(); void handleSubmit(e.nativeEvent); }} data-testid="login-form-element">
        <div className={styles['fieldGroup']}>
          <label className={styles['label']} htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className={styles['input']}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoComplete="email"
            data-testid="login-email"
          />
        </div>

        <div className={styles['fieldGroup']}>
          <label className={styles['label']} htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className={styles['input']}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            data-testid="login-password"
          />
        </div>

        <button
          type="submit"
          className={styles['submitButton']}
          disabled={loading || !email || !password}
          data-testid="login-submit"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className={styles['divider']}>or</div>

      <OAuthButtons />

      {onSwitchToSignup && (
        <p className={styles['switchLink']}>
          Don&apos;t have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToSignup(); }} data-testid="switch-to-signup">
            Sign Up
          </a>
        </p>
      )}
    </div>
  );
}

export default LoginForm;
