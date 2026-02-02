/**
 * UserAvatar Component Unit Tests
 *
 * Tests for avatar rendering, score badge, and click handling.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserAvatar } from './UserAvatar';

describe('UserAvatar', () => {
  describe('Rendering', () => {
    it('should render the avatar container', () => {
      render(<UserAvatar />);
      expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      render(<UserAvatar testId="custom-avatar" />);
      expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<UserAvatar className="custom-class" />);
      const container = screen.getByTestId('user-avatar');
      expect(container.className).toContain('custom-class');
    });
  });

  describe('Image display', () => {
    it('should render image when avatarUrl is provided', () => {
      render(
        <UserAvatar
          avatarUrl="https://example.com/avatar.jpg"
          username="testuser"
        />
      );

      const image = screen.getByTestId('user-avatar-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should have correct alt text for image', () => {
      render(
        <UserAvatar
          avatarUrl="https://example.com/avatar.jpg"
          username="testuser"
        />
      );

      const image = screen.getByTestId('user-avatar-image');
      expect(image).toHaveAttribute('alt', "testuser's avatar");
    });

    it('should have fallback alt text when no username', () => {
      render(
        <UserAvatar
          avatarUrl="https://example.com/avatar.jpg"
        />
      );

      const image = screen.getByTestId('user-avatar-image');
      expect(image).toHaveAttribute('alt', 'User avatar');
    });
  });

  describe('Initial display', () => {
    it('should render initial when no avatarUrl', () => {
      render(<UserAvatar username="testuser" />);

      const initial = screen.getByTestId('user-avatar-initial');
      expect(initial).toBeInTheDocument();
      expect(initial.textContent).toBe('T');
    });

    it('should uppercase the initial', () => {
      render(<UserAvatar username="lowercase" />);

      const initial = screen.getByTestId('user-avatar-initial');
      expect(initial.textContent).toBe('L');
    });

    it('should show "?" when no username', () => {
      render(<UserAvatar />);

      const initial = screen.getByTestId('user-avatar-initial');
      expect(initial.textContent).toBe('?');
    });
  });

  describe('Score badge', () => {
    it('should display score badge when score is provided', () => {
      render(<UserAvatar score={500} />);

      const badge = screen.getByTestId('user-avatar-score');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('500');
    });

    it('should format score in thousands', () => {
      render(<UserAvatar score={1500} />);

      const badge = screen.getByTestId('user-avatar-score');
      expect(badge.textContent).toBe('1k');
    });

    it('should format score in millions', () => {
      render(<UserAvatar score={1500000} />);

      const badge = screen.getByTestId('user-avatar-score');
      expect(badge.textContent).toBe('1m');
    });

    it('should not display score badge when score is null', () => {
      render(<UserAvatar score={null} />);

      expect(screen.queryByTestId('user-avatar-score')).not.toBeInTheDocument();
    });

    it('should not display score badge when score is undefined', () => {
      render(<UserAvatar />);

      expect(screen.queryByTestId('user-avatar-score')).not.toBeInTheDocument();
    });

    it('should display score of 0', () => {
      render(<UserAvatar score={0} />);

      const badge = screen.getByTestId('user-avatar-score');
      expect(badge.textContent).toBe('0');
    });
  });

  describe('Click handling', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<UserAvatar onClick={handleClick} />);

      fireEvent.click(screen.getByTestId('user-avatar'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on Enter key', () => {
      const handleClick = vi.fn();
      render(<UserAvatar onClick={handleClick} />);

      fireEvent.keyDown(screen.getByTestId('user-avatar'), { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on Space key', () => {
      const handleClick = vi.fn();
      render(<UserAvatar onClick={handleClick} />);

      fireEvent.keyDown(screen.getByTestId('user-avatar'), { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when clicked without onClick handler', () => {
      render(<UserAvatar />);

      expect(() => {
        fireEvent.click(screen.getByTestId('user-avatar'));
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      render(<UserAvatar />);

      const container = screen.getByTestId('user-avatar');
      expect(container).toHaveAttribute('role', 'button');
    });

    it('should have aria-label with username', () => {
      render(<UserAvatar username="testuser" />);

      const container = screen.getByTestId('user-avatar');
      expect(container).toHaveAttribute('aria-label', "testuser's profile");
    });

    it('should have fallback aria-label when no username', () => {
      render(<UserAvatar />);

      const container = screen.getByTestId('user-avatar');
      expect(container).toHaveAttribute('aria-label', 'User profile');
    });

    it('should be focusable when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<UserAvatar onClick={handleClick} />);

      const container = screen.getByTestId('user-avatar');
      expect(container).toHaveAttribute('tabIndex', '0');
    });

    it('should not be focusable when onClick is not provided', () => {
      render(<UserAvatar />);

      const container = screen.getByTestId('user-avatar');
      expect(container).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Size', () => {
    it('should use default size of 36px', () => {
      render(<UserAvatar />);

      const avatar = screen.getByTestId('user-avatar').querySelector('[class*="avatar"]');
      expect(avatar).toHaveStyle({ width: '36px', height: '36px' });
    });

    it('should apply custom size', () => {
      render(<UserAvatar size={48} />);

      const avatar = screen.getByTestId('user-avatar').querySelector('[class*="avatar"]');
      expect(avatar).toHaveStyle({ width: '48px', height: '48px' });
    });
  });
});
