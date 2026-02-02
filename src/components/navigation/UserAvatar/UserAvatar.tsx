/**
 * UserAvatar Component
 *
 * Displays the user's avatar with score badge.
 * Shows image if available, otherwise first letter of username.
 *
 * Requirements: 5.1-5.7
 */

import React from 'react';
import { formatScore } from '../../../utils/formatScore';
import styles from './UserAvatar.module.css';

export interface UserAvatarProps {
  /** User's avatar URL */
  avatarUrl?: string | null;
  /** Username for fallback initial */
  username?: string | null;
  /** User's score */
  score?: number | null;
  /** Click handler (navigates to profile) */
  onClick?: () => void;
  /** Size of the avatar in pixels */
  size?: number;
  /** Additional CSS class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Gets the first character of a username for the fallback display.
 */
function getInitial(username: string | null | undefined): string {
  if (!username || username.length === 0) {
    return '?';
  }
  return username.charAt(0).toUpperCase();
}

/**
 * UserAvatar component that displays user avatar with score badge.
 * Falls back to username initial if no avatar URL is provided.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  username,
  score,
  onClick,
  size = 36,
  className,
  testId = 'user-avatar',
}) => {
  const hasAvatar = avatarUrl && avatarUrl.length > 0;
  const hasScore = score !== null && score !== undefined;

  const containerClass = [
    styles['container'],
    className,
  ].filter(Boolean).join(' ');

  const avatarStyle = {
    width: `${String(size)}px`,
    height: `${String(size)}px`,
  };

  const handleClick = () => {
    onClick?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={containerClass}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={onClick ? 0 : -1}
      aria-label={username ? `${username}'s profile` : 'User profile'}
      data-testid={testId}
    >
      <div className={styles['avatar']} style={avatarStyle}>
        {hasAvatar ? (
          <img
            src={avatarUrl}
            alt={username ? `${username}'s avatar` : 'User avatar'}
            className={styles['avatarImage']}
            data-testid={`${testId}-image`}
          />
        ) : (
          <span
            className={styles['avatarInitial']}
            data-testid={`${testId}-initial`}
          >
            {getInitial(username)}
          </span>
        )}
      </div>
      {hasScore && (
        <span
          className={styles['scoreBadge']}
          data-testid={`${testId}-score`}
        >
          {formatScore(score)}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
