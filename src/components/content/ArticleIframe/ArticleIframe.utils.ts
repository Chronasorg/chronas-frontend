/**
 * ArticleIframe Utility Functions
 *
 * URL validation for Wikipedia/Wikimedia domains.
 * Extracted from ArticleIframe.tsx to satisfy react-refresh/only-export-components.
 */

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
