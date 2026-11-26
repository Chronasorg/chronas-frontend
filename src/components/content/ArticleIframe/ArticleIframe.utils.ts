/**
 * ArticleIframe Utility Functions
 *
 * URL validation for Wikipedia/Wikimedia domains.
 * Extracted from ArticleIframe.tsx to satisfy react-refresh/only-export-components.
 */

const TRUSTED_DOMAINS = ['wikipedia.org', 'wikimedia.org'];

/**
 * Validates that a URL is an https URL on a Wikipedia or Wikimedia host: the
 * domain itself or one of its subdomains (en.wikipedia.org,
 * upload.wikimedia.org). A host that only ends in the same letters, like
 * evilwikipedia.org, is refused, and so is plain http.
 *
 * @param url - The URL to validate
 * @returns true if the URL may be shown in the article iframe
 */
export function isValidWikiUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== 'https:') return false;
    const host = hostname.toLowerCase();
    return TRUSTED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}
