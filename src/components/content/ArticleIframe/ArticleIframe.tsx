/**
 * ArticleIframe Component
 *
 * Embeds Wikipedia content in a secure iframe with loading and error states.
 *
 * Requirements: 2.6, 3.7, 10.6, 11.3, 11.4
 *
 * Security:
 * - Validates URLs to ensure they are from trusted Wikipedia/Wikimedia domains
 * - Uses sandbox attributes to restrict iframe capabilities
 * - Only allows scripts, same-origin, and popups
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './ArticleIframe.module.css';

export interface ArticleIframeProps {
  /** Wikipedia URL to display */
  url: string | undefined;
  /** Title for accessibility (Requirement 10.6) */
  title: string;
  /** Callback when loading state changes */
  onLoadStateChange?: (loading: boolean, error?: Error) => void;
}

/**
 * Sandbox attributes for Wikipedia iframe (Security)
 * - allow-scripts: Required for Wikipedia's interactive features
 * - allow-same-origin: Required for Wikipedia's functionality
 * - allow-popups: Allows opening links in new tabs
 */
const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-popups';

/**
 * Validates that a URL is from a trusted Wikipedia/Wikimedia domain.
 * This prevents embedding content from untrusted sources.
 *
 * @param url - The URL to validate
 * @returns true if the URL is from wikipedia.org or wikimedia.org
 */
export function isValidWikiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith('wikipedia.org') ||
      parsed.hostname.endsWith('wikimedia.org')
    );
  } catch {
    return false;
  }
}

/**
 * Loading spinner component for iframe loading state
 */
const LoadingSpinner: React.FC = () => {
  const spinnerClass = styles['spinner'] ?? '';
  const spinnerInnerClass = styles['spinnerInner'] ?? '';
  const loadingTextClass = styles['loadingText'] ?? '';

  return (
    <div className={spinnerClass} role="status" aria-live="polite">
      <div className={spinnerInnerClass} aria-hidden="true" />
      <span className={loadingTextClass}>Loading article...</span>
    </div>
  );
};

/**
 * Error display component with retry option
 */
interface ErrorDisplayProps {
  error: Error;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  const errorContainerClass = styles['errorContainer'] ?? '';
  const errorIconClass = styles['errorIcon'] ?? '';
  const errorMessageClass = styles['errorMessage'] ?? '';
  const retryButtonClass = styles['retryButton'] ?? '';

  return (
    <div
      className={errorContainerClass}
      role="alert"
      aria-live="assertive"
      data-testid="article-iframe-error"
    >
      <span className={errorIconClass} aria-hidden="true">
        ⚠️
      </span>
      <p className={errorMessageClass}>
        {error.message || 'Failed to load article'}
      </p>
      <button
        type="button"
        className={retryButtonClass}
        onClick={onRetry}
        aria-label="Retry loading article"
      >
        Retry
      </button>
    </div>
  );
};

/**
 * No article available display component
 */
const NoArticleDisplay: React.FC = () => {
  const noArticleClass = styles['noArticle'] ?? '';
  const noArticleIconClass = styles['noArticleIcon'] ?? '';
  const noArticleTextClass = styles['noArticleText'] ?? '';

  return (
    <div
      className={noArticleClass}
      role="status"
      data-testid="article-iframe-no-article"
    >
      <span className={noArticleIconClass} aria-hidden="true">
        📄
      </span>
      <p className={noArticleTextClass}>No Wikipedia article available</p>
    </div>
  );
};

/**
 * Invalid URL display component
 */
const InvalidUrlDisplay: React.FC = () => {
  const invalidUrlClass = styles['invalidUrl'] ?? '';
  const invalidUrlIconClass = styles['invalidUrlIcon'] ?? '';
  const invalidUrlTextClass = styles['invalidUrlText'] ?? '';

  return (
    <div
      className={invalidUrlClass}
      role="alert"
      data-testid="article-iframe-invalid-url"
    >
      <span className={invalidUrlIconClass} aria-hidden="true">
        🔒
      </span>
      <p className={invalidUrlTextClass}>
        Invalid article URL. Only Wikipedia articles are supported.
      </p>
    </div>
  );
};

/**
 * ArticleIframe component - Embeds Wikipedia content in a secure iframe.
 *
 * Features:
 * - Validates URLs to trusted Wikipedia/Wikimedia domains
 * - Shows loading indicator while iframe loads (Requirement 11.3)
 * - Handles load errors with retry option (Requirement 11.4)
 * - Displays "No Wikipedia article available" for missing URLs (Requirement 2.10, 3.8)
 * - Provides accessible title attribute (Requirement 10.6)
 * - Uses sandbox attributes for security
 */
export const ArticleIframe: React.FC<ArticleIframeProps> = ({
  url,
  title,
  onLoadStateChange,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset state when URL changes
  useEffect(() => {
    if (url && isValidWikiUrl(url)) {
      setIsLoading(true);
      setError(null);
    }
  }, [url, retryCount]);

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadStateChange?.(isLoading, error ?? undefined);
  }, [isLoading, error, onLoadStateChange]);

  // Handle iframe load success
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  // Handle iframe load error
  const handleError = useCallback(() => {
    setIsLoading(false);
    setError(new Error('Failed to load Wikipedia article'));
  }, []);

  // Handle retry button click
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  // Safe CSS class access
  const containerClass = styles['container'] ?? '';
  const iframeWrapperClass = styles['iframeWrapper'] ?? '';
  const iframeClass = styles['iframe'] ?? '';
  const loadingOverlayClass = styles['loadingOverlay'] ?? '';

  // Case 1: No URL provided
  if (!url) {
    return (
      <div className={containerClass} data-testid="article-iframe-container">
        <NoArticleDisplay />
      </div>
    );
  }

  // Case 2: Invalid URL (not from Wikipedia/Wikimedia)
  if (!isValidWikiUrl(url)) {
    return (
      <div className={containerClass} data-testid="article-iframe-container">
        <InvalidUrlDisplay />
      </div>
    );
  }

  // Case 3: Valid URL - show iframe with loading/error states
  return (
    <div className={containerClass} data-testid="article-iframe-container">
      <div className={iframeWrapperClass}>
        {/* Loading overlay (Requirement 11.3) */}
        {isLoading && !error && (
          <div className={loadingOverlayClass}>
            <LoadingSpinner />
          </div>
        )}

        {/* Error display with retry (Requirement 11.4) */}
        {error && <ErrorDisplay error={error} onRetry={handleRetry} />}

        {/* Wikipedia iframe */}
        {!error && (
          <iframe
            ref={iframeRef}
            key={`${url}-${String(retryCount)}`}
            src={url}
            title={title}
            className={iframeClass}
            sandbox={IFRAME_SANDBOX}
            onLoad={handleLoad}
            onError={handleError}
            data-testid="article-iframe"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  );
};

export default ArticleIframe;
