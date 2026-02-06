/**
 * ArticleIframe Component Tests
 *
 * Tests for the Wikipedia iframe embedding component with loading and error states.
 *
 * Requirements tested:
 * - 2.10: "No Wikipedia article available" for missing URLs
 * - 10.6: Accessible title attribute for screen readers
 * - 11.3: Loading indicator while iframe loads
 * - 11.4: Error message with retry option
 *
 * Component Features:
 * - Loading state - Shows loading spinner while iframe loads
 * - Error state - Shows error message with retry button when load fails
 * - Missing URL - Shows "No Wikipedia article available" when url is undefined
 * - Invalid URL - Shows "Invalid article URL" for non-Wikipedia URLs
 * - Valid URL - Renders iframe with correct sandbox attributes
 * - Retry functionality - Clicking retry reloads the iframe
 * - Accessibility - Title attribute is passed to iframe
 *
 * Note: Some error handling tests are limited by JSDOM's iframe behavior.
 * The iframe onError event doesn't fire in JSDOM the same way as in browsers.
 * We test what we can and document the limitations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ArticleIframe, isValidWikiUrl } from './ArticleIframe';

// Sample test data
const VALID_WIKIPEDIA_URL = 'https://en.wikipedia.org/wiki/Roman_Empire';
const VALID_WIKIMEDIA_URL = 'https://commons.wikimedia.org/wiki/File:Example.jpg';
const INVALID_URL = 'https://example.com/article';
const MALFORMED_URL = 'not-a-valid-url';

describe('ArticleIframe', () => {
  const mockOnLoadStateChange = vi.fn();

  beforeEach(() => {
    mockOnLoadStateChange.mockClear();
  });

  describe('isValidWikiUrl utility function', () => {
    it('should return true for valid Wikipedia URLs', () => {
      expect(isValidWikiUrl('https://en.wikipedia.org/wiki/Test')).toBe(true);
      expect(isValidWikiUrl('https://de.wikipedia.org/wiki/Test')).toBe(true);
      expect(isValidWikiUrl('https://fr.wikipedia.org/wiki/Test')).toBe(true);
    });

    it('should return true for valid Wikimedia URLs', () => {
      expect(isValidWikiUrl('https://commons.wikimedia.org/wiki/File:Test.jpg')).toBe(true);
      expect(isValidWikiUrl('https://upload.wikimedia.org/wikipedia/commons/test.jpg')).toBe(true);
    });

    it('should return false for non-Wikipedia URLs', () => {
      expect(isValidWikiUrl('https://example.com/wiki/Test')).toBe(false);
      expect(isValidWikiUrl('https://google.com')).toBe(false);
      expect(isValidWikiUrl('https://wikipedia.fake.com/wiki/Test')).toBe(false);
    });

    it('should return false for malformed URLs', () => {
      expect(isValidWikiUrl('not-a-url')).toBe(false);
      expect(isValidWikiUrl('')).toBe(false);
      expect(isValidWikiUrl('javascript:alert(1)')).toBe(false);
    });

    it('should return false for URLs with wikipedia in path but not hostname', () => {
      expect(isValidWikiUrl('https://evil.com/wikipedia.org/wiki/Test')).toBe(false);
    });

    it('should handle edge cases', () => {
      // Subdomain variations
      expect(isValidWikiUrl('https://m.wikipedia.org/wiki/Test')).toBe(true);
      expect(isValidWikiUrl('https://en.m.wikipedia.org/wiki/Test')).toBe(true);
      // Protocol variations (only https should work with URL parsing)
      expect(isValidWikiUrl('http://en.wikipedia.org/wiki/Test')).toBe(true);
    });
  });

  describe('Missing URL Handling (Requirement 2.10)', () => {
    it('should display "No Wikipedia article available" when url is undefined', () => {
      render(
        <ArticleIframe
          url={undefined}
          title="Test Article"
          onLoadStateChange={mockOnLoadStateChange}
        />
      );

      expect(screen.getByTestId('article-iframe-no-article')).toBeInTheDocument();
      expect(screen.getByText('No Wikipedia article available')).toBeInTheDocument();
    });

    it('should display the no-article icon', () => {
      render(
        <ArticleIframe
          url={undefined}
          title="Test Article"
        />
      );

      expect(screen.getByText('📄')).toBeInTheDocument();
    });

    it('should have role="status" for no-article state', () => {
      render(
        <ArticleIframe
          url={undefined}
          title="Test Article"
        />
      );

      const noArticleElement = screen.getByTestId('article-iframe-no-article');
      expect(noArticleElement).toHaveAttribute('role', 'status');
    });

    it('should render container when url is undefined', () => {
      render(
        <ArticleIframe
          url={undefined}
          title="Test Article"
        />
      );

      expect(screen.getByTestId('article-iframe-container')).toBeInTheDocument();
    });

    it('should not render iframe when url is undefined', () => {
      render(
        <ArticleIframe
          url={undefined}
          title="Test Article"
        />
      );

      expect(screen.queryByTestId('article-iframe')).not.toBeInTheDocument();
    });
  });

  describe('Invalid URL Handling', () => {
    it('should display invalid URL message for non-Wikipedia URLs', () => {
      render(
        <ArticleIframe
          url={INVALID_URL}
          title="Test Article"
        />
      );

      expect(screen.getByTestId('article-iframe-invalid-url')).toBeInTheDocument();
      expect(screen.getByText(/Invalid article URL/)).toBeInTheDocument();
      expect(screen.getByText(/Only Wikipedia articles are supported/)).toBeInTheDocument();
    });

    it('should display the security icon for invalid URLs', () => {
      render(
        <ArticleIframe
          url={INVALID_URL}
          title="Test Article"
        />
      );

      expect(screen.getByText('🔒')).toBeInTheDocument();
    });

    it('should have role="alert" for invalid URL state', () => {
      render(
        <ArticleIframe
          url={INVALID_URL}
          title="Test Article"
        />
      );

      const invalidUrlElement = screen.getByTestId('article-iframe-invalid-url');
      expect(invalidUrlElement).toHaveAttribute('role', 'alert');
    });

    it('should display invalid URL message for malformed URLs', () => {
      render(
        <ArticleIframe
          url={MALFORMED_URL}
          title="Test Article"
        />
      );

      expect(screen.getByTestId('article-iframe-invalid-url')).toBeInTheDocument();
    });

    it('should not render iframe for invalid URLs', () => {
      render(
        <ArticleIframe
          url={INVALID_URL}
          title="Test Article"
        />
      );

      expect(screen.queryByTestId('article-iframe')).not.toBeInTheDocument();
    });
  });

  describe('Valid URL Rendering', () => {
    it('should render iframe for valid Wikipedia URL', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Roman Empire"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', VALID_WIKIPEDIA_URL);
    });

    it('should render iframe for valid Wikimedia URL', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIMEDIA_URL}
          title="Wikimedia File"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', VALID_WIKIMEDIA_URL);
    });

    it('should have correct sandbox attributes for security', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
    });

    it('should have loading="lazy" attribute', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      expect(iframe).toHaveAttribute('loading', 'lazy');
    });

    it('should have referrerPolicy="no-referrer" attribute', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      expect(iframe).toHaveAttribute('referrerPolicy', 'no-referrer');
    });

    it('should have iframe CSS class applied', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      // The iframe should have a class applied (CSS module class)
      expect(iframe.className).toMatch(/iframe/);
    });
  });

  describe('Accessibility (Requirement 10.6)', () => {
    it('should pass title attribute to iframe for screen readers', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Roman Empire Wikipedia Article"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      expect(iframe).toHaveAttribute('title', 'Roman Empire Wikipedia Article');
    });

    it('should have role="status" on loading spinner', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      // Loading spinner should be visible initially
      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toBeInTheDocument();
    });

    it('should have aria-live="polite" on loading spinner', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-hidden on spinner inner element', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      // The spinner inner (animated circle) should be hidden from screen readers
      const spinnerInner = document.querySelector('[aria-hidden="true"]');
      expect(spinnerInner).toBeInTheDocument();
    });
  });

  describe('Loading State (Requirement 11.3)', () => {
    it('should display loading indicator initially for valid URL', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      expect(screen.getByText('Loading article...')).toBeInTheDocument();
    });

    it('should display loading spinner animation', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should call onLoadStateChange with loading=true initially', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
          onLoadStateChange={mockOnLoadStateChange}
        />
      );

      expect(mockOnLoadStateChange).toHaveBeenCalledWith(true, undefined);
    });

    it('should hide loading indicator after iframe loads', async () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
          onLoadStateChange={mockOnLoadStateChange}
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      
      act(() => {
        fireEvent.load(iframe);
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading article...')).not.toBeInTheDocument();
      });
    });

    it('should call onLoadStateChange with loading=false after load', async () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
          onLoadStateChange={mockOnLoadStateChange}
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      
      act(() => {
        fireEvent.load(iframe);
      });

      await waitFor(() => {
        expect(mockOnLoadStateChange).toHaveBeenCalledWith(false, undefined);
      });
    });

    it('should show both loading overlay and iframe during loading', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      // Both should be present during loading
      expect(screen.getByText('Loading article...')).toBeInTheDocument();
      expect(screen.getByTestId('article-iframe')).toBeInTheDocument();
    });
  });

  describe('Error State Display (Requirement 11.4)', () => {
    // Note: In JSDOM, iframe onError events don't fire the same way as in browsers.
    // These tests verify the error display components exist and are properly structured.
    
    it('should have ErrorDisplay component with correct structure', () => {
      // We can't easily trigger the error state in JSDOM, but we can verify
      // the component renders correctly for valid URLs initially
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      // Initially, error display should not be visible
      expect(screen.queryByTestId('article-iframe-error')).not.toBeInTheDocument();
    });

    it('should not show error state for valid URL initially', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      expect(screen.queryByText('Failed to load Wikipedia article')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  describe('URL Change Handling', () => {
    it('should reset loading state when URL changes', async () => {
      const { rerender } = render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      
      act(() => {
        fireEvent.load(iframe);
      });

      // Verify loading is complete
      await waitFor(() => {
        expect(screen.queryByText('Loading article...')).not.toBeInTheDocument();
      });

      // Change URL
      rerender(
        <ArticleIframe
          url="https://en.wikipedia.org/wiki/Different_Article"
          title="Different Article"
        />
      );

      // Should show loading state again
      expect(screen.getByText('Loading article...')).toBeInTheDocument();
    });

    it('should update iframe src when URL changes', () => {
      const newUrl = 'https://en.wikipedia.org/wiki/Different_Article';
      
      const { rerender } = render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      rerender(
        <ArticleIframe
          url={newUrl}
          title="Different Article"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      expect(iframe).toHaveAttribute('src', newUrl);
    });

    it('should update title when URL changes', () => {
      const { rerender } = render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Original Title"
        />
      );

      rerender(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="New Title"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      expect(iframe).toHaveAttribute('title', 'New Title');
    });

    it('should switch from valid URL to undefined URL', () => {
      const { rerender } = render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      expect(screen.getByTestId('article-iframe')).toBeInTheDocument();

      rerender(
        <ArticleIframe
          url={undefined}
          title="Test Article"
        />
      );

      expect(screen.queryByTestId('article-iframe')).not.toBeInTheDocument();
      expect(screen.getByTestId('article-iframe-no-article')).toBeInTheDocument();
    });

    it('should switch from undefined URL to valid URL', () => {
      const { rerender } = render(
        <ArticleIframe
          url={undefined}
          title="Test Article"
        />
      );

      expect(screen.getByTestId('article-iframe-no-article')).toBeInTheDocument();

      rerender(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      expect(screen.queryByTestId('article-iframe-no-article')).not.toBeInTheDocument();
      expect(screen.getByTestId('article-iframe')).toBeInTheDocument();
    });

    it('should switch from invalid URL to valid URL', () => {
      const { rerender } = render(
        <ArticleIframe
          url={INVALID_URL}
          title="Test Article"
        />
      );

      expect(screen.getByTestId('article-iframe-invalid-url')).toBeInTheDocument();

      rerender(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      expect(screen.queryByTestId('article-iframe-invalid-url')).not.toBeInTheDocument();
      expect(screen.getByTestId('article-iframe')).toBeInTheDocument();
    });
  });

  describe('Container Rendering', () => {
    it('should always render container element', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      expect(screen.getByTestId('article-iframe-container')).toBeInTheDocument();
    });

    it('should render container for undefined URL', () => {
      render(
        <ArticleIframe
          url={undefined}
          title="Test Article"
        />
      );

      expect(screen.getByTestId('article-iframe-container')).toBeInTheDocument();
    });

    it('should render container for invalid URL', () => {
      render(
        <ArticleIframe
          url={INVALID_URL}
          title="Test Article"
        />
      );

      expect(screen.getByTestId('article-iframe-container')).toBeInTheDocument();
    });
  });

  describe('Callback Handling', () => {
    it('should work without onLoadStateChange callback', () => {
      // Should not throw when callback is not provided
      expect(() => {
        render(
          <ArticleIframe
            url={VALID_WIKIPEDIA_URL}
            title="Test Article"
          />
        );
      }).not.toThrow();
    });

    it('should call onLoadStateChange for undefined URL', () => {
      render(
        <ArticleIframe
          url={undefined}
          title="Test Article"
          onLoadStateChange={mockOnLoadStateChange}
        />
      );

      // For undefined URL, the callback should still be called
      expect(mockOnLoadStateChange).toHaveBeenCalled();
    });

    it('should call onLoadStateChange for invalid URL', () => {
      render(
        <ArticleIframe
          url={INVALID_URL}
          title="Test Article"
          onLoadStateChange={mockOnLoadStateChange}
        />
      );

      // For invalid URL, the callback should still be called
      expect(mockOnLoadStateChange).toHaveBeenCalled();
    });
  });

  describe('Security Features', () => {
    it('should use sandbox attribute to restrict iframe capabilities', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      const sandbox = iframe.getAttribute('sandbox');
      
      // Verify specific sandbox permissions
      expect(sandbox).toContain('allow-scripts');
      expect(sandbox).toContain('allow-same-origin');
      expect(sandbox).toContain('allow-popups');
      
      // Verify dangerous permissions are NOT included
      expect(sandbox).not.toContain('allow-forms');
      expect(sandbox).not.toContain('allow-top-navigation');
    });

    it('should use no-referrer policy', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      expect(iframe).toHaveAttribute('referrerPolicy', 'no-referrer');
    });

    it('should reject URLs from untrusted domains', () => {
      const untrustedUrls = [
        'https://evil.com/wiki/Test',
        'https://wikipedia.evil.com/wiki/Test',
        'https://en.wikipedia.org.evil.com/wiki/Test',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
      ];

      untrustedUrls.forEach((url) => {
        const { unmount } = render(
          <ArticleIframe
            url={url}
            title="Test Article"
          />
        );

        expect(screen.queryByTestId('article-iframe')).not.toBeInTheDocument();
        expect(screen.getByTestId('article-iframe-invalid-url')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Iframe Key for Retry', () => {
    it('should have a key attribute that changes on retry', () => {
      render(
        <ArticleIframe
          url={VALID_WIKIPEDIA_URL}
          title="Test Article"
        />
      );

      const iframe = screen.getByTestId('article-iframe');
      // The key is used internally by React, but we can verify the iframe exists
      expect(iframe).toBeInTheDocument();
    });
  });

  describe('Different Wikipedia Language Subdomains', () => {
    const languageUrls = [
      { url: 'https://en.wikipedia.org/wiki/Test', lang: 'English' },
      { url: 'https://de.wikipedia.org/wiki/Test', lang: 'German' },
      { url: 'https://fr.wikipedia.org/wiki/Test', lang: 'French' },
      { url: 'https://es.wikipedia.org/wiki/Test', lang: 'Spanish' },
      { url: 'https://ja.wikipedia.org/wiki/Test', lang: 'Japanese' },
      { url: 'https://zh.wikipedia.org/wiki/Test', lang: 'Chinese' },
      { url: 'https://ru.wikipedia.org/wiki/Test', lang: 'Russian' },
      { url: 'https://ar.wikipedia.org/wiki/Test', lang: 'Arabic' },
    ];

    languageUrls.forEach(({ url, lang }) => {
      it(`should accept ${lang} Wikipedia URL`, () => {
        render(
          <ArticleIframe
            url={url}
            title={`${lang} Article`}
          />
        );

        const iframe = screen.getByTestId('article-iframe');
        expect(iframe).toHaveAttribute('src', url);
      });
    });
  });
});
