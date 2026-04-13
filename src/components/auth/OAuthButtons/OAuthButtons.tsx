/**
 * OAuthButtons Component
 *
 * OAuth login buttons for Facebook, Google, GitHub, Twitter.
 * Requirements: US-8.2
 */

import { env } from '@/config/env';
import styles from './OAuthButtons.module.css';

const API_BASE = env.apiBaseUrl;

const PROVIDERS = [
  { id: 'google', label: 'Google', color: '#4285F4', path: '/auth/login/google' },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', path: '/auth/login/facebook' },
  { id: 'github', label: 'GitHub', color: '#333', path: '/auth/login/github' },
  { id: 'twitter', label: 'Twitter', color: '#1DA1F2', path: '/auth/login/twitter' },
] as const;

export interface OAuthButtonsProps {
  testId?: string;
}

export function OAuthButtons({ testId = 'oauth-buttons' }: OAuthButtonsProps) {
  return (
    <div className={styles['container']} data-testid={testId}>
      {PROVIDERS.map((provider) => (
        <a
          key={provider.id}
          href={`${API_BASE}${provider.path}`}
          className={styles['button']}
          style={{ backgroundColor: provider.color }}
          data-testid={`oauth-${provider.id}`}
          aria-label={`Sign in with ${provider.label}`}
        >
          {provider.label}
        </a>
      ))}
    </div>
  );
}

export default OAuthButtons;
