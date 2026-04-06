/**
 * SignupForm Component
 * Requirements: US-8.3
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { apiClient } from '@/api/client';
import { AUTH } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import styles from '../LoginForm/LoginForm.module.css';

export interface SignupFormProps {
  onSwitchToLogin?: () => void;
  testId?: string;
}

export function SignupForm({ onSwitchToLogin, testId = 'signup-form' }: SignupFormProps) {
  const [username, setUsername] = useState('');
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
      const response = await apiClient.post<{ token: string }>(AUTH.SIGNUP, { username, email, password });
      if (response.token) {
        setUser(response.token);
        void navigate('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [username, email, password, setUser, navigate]);

  return (
    <div className={styles['container']} data-testid={testId}>
      <h2 className={styles['title']}>Create Account</h2>

      {error && <div className={styles['error']} data-testid="signup-error" role="alert">{error}</div>}

      <form className={styles['form']} onSubmit={(e) => { e.preventDefault(); void handleSubmit(e.nativeEvent); }} data-testid="signup-form-element">
        <div className={styles['fieldGroup']}>
          <label className={styles['label']} htmlFor="signup-username">Username</label>
          <input id="signup-username" className={styles['input']} type="text" value={username}
            onChange={(e) => setUsername(e.target.value)} placeholder="Username" required
            autoComplete="username" data-testid="signup-username" />
        </div>

        <div className={styles['fieldGroup']}>
          <label className={styles['label']} htmlFor="signup-email">Email</label>
          <input id="signup-email" className={styles['input']} type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required
            autoComplete="email" data-testid="signup-email" />
        </div>

        <div className={styles['fieldGroup']}>
          <label className={styles['label']} htmlFor="signup-password">Password</label>
          <input id="signup-password" className={styles['input']} type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required
            minLength={8} autoComplete="new-password" data-testid="signup-password" />
        </div>

        <button type="submit" className={styles['submitButton']}
          disabled={loading || !username || !email || !password}
          data-testid="signup-submit">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      {onSwitchToLogin && (
        <p className={styles['switchLink']}>
          Already have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }} data-testid="switch-to-login">
            Sign In
          </a>
        </p>
      )}
    </div>
  );
}

export default SignupForm;
