/**
 * Property-based tests for UserAvatar component
 *
 * Feature: header-navigation-migration
 * Property 6: Avatar Display with Fallback
 *
 * **Validates: Requirements 5.2, 5.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { UserAvatar } from './UserAvatar';

describe('UserAvatar - Property Tests', () => {
  /**
   * Property 6: Avatar Display with Fallback
   *
   * *For any* user with an avatar URL, the UserAvatar SHALL display an image
   * element with that URL. *For any* user without an avatar URL but with a
   * username, the UserAvatar SHALL display the first character of the username.
   *
   * **Validates: Requirements 5.2, 5.3**
   */
  describe('Property 6: Avatar Display with Fallback', () => {
    it('should display image when avatarUrl is provided', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (avatarUrl, username) => {
            const { unmount } = render(
              <UserAvatar
                avatarUrl={avatarUrl}
                username={username}
              />
            );

            const image = screen.getByTestId('user-avatar-image');
            expect(image).toBeInTheDocument();
            expect(image.tagName.toLowerCase()).toBe('img');
            expect(image).toHaveAttribute('src', avatarUrl);
            
            // Should NOT show initial when image is present
            expect(screen.queryByTestId('user-avatar-initial')).not.toBeInTheDocument();
            
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display first character of username when no avatarUrl', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (username) => {
            const { unmount } = render(
              <UserAvatar
                avatarUrl={null}
                username={username}
              />
            );

            const initial = screen.getByTestId('user-avatar-initial');
            expect(initial).toBeInTheDocument();
            expect(initial.textContent).toBe(username.charAt(0).toUpperCase());
            
            // Should NOT show image when no avatarUrl
            expect(screen.queryByTestId('user-avatar-image')).not.toBeInTheDocument();
            
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display "?" when no avatarUrl and no username', () => {
      const { unmount } = render(
        <UserAvatar
          avatarUrl={null}
          username={null}
        />
      );

      const initial = screen.getByTestId('user-avatar-initial');
      expect(initial).toBeInTheDocument();
      expect(initial.textContent).toBe('?');
      
      unmount();
    });

    it('should display "?" when no avatarUrl and empty username', () => {
      const { unmount } = render(
        <UserAvatar
          avatarUrl={null}
          username=""
        />
      );

      const initial = screen.getByTestId('user-avatar-initial');
      expect(initial).toBeInTheDocument();
      expect(initial.textContent).toBe('?');
      
      unmount();
    });

    it('should prefer image over initial when both avatarUrl and username provided', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (avatarUrl, username) => {
            const { unmount } = render(
              <UserAvatar
                avatarUrl={avatarUrl}
                username={username}
              />
            );

            // Image should be present
            expect(screen.getByTestId('user-avatar-image')).toBeInTheDocument();
            // Initial should NOT be present
            expect(screen.queryByTestId('user-avatar-initial')).not.toBeInTheDocument();
            
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle undefined avatarUrl as no avatar', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (username) => {
            const { unmount } = render(
              <UserAvatar
                username={username}
              />
            );

            // Should show initial, not image
            expect(screen.getByTestId('user-avatar-initial')).toBeInTheDocument();
            expect(screen.queryByTestId('user-avatar-image')).not.toBeInTheDocument();
            
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty string avatarUrl as no avatar', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (username) => {
            const { unmount } = render(
              <UserAvatar
                avatarUrl=""
                username={username}
              />
            );

            // Should show initial, not image
            expect(screen.getByTestId('user-avatar-initial')).toBeInTheDocument();
            expect(screen.queryByTestId('user-avatar-image')).not.toBeInTheDocument();
            
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
