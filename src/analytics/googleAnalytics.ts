/**
 * Loads Google Analytics (gtag.js) when VITE_GA_MEASUREMENT_ID is set.
 *
 * This used to be an inline <script> in index.html. It lives in the bundle so
 * the Content-Security-Policy can forbid inline scripts (pentest C2, 2026-11;
 * the CSP is set by CloudFront, see infra/edge/). Page views are sent by
 * useAnalytics on route changes, so the config call turns the automatic one off.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export const GTAG_SCRIPT_URL = 'https://www.googletagmanager.com/gtag/js';

export function initGoogleAnalytics(
  measurementId: unknown = import.meta.env.VITE_GA_MEASUREMENT_ID
): void {
  if (typeof measurementId !== 'string' || measurementId.trim() === '') return;
  const id = measurementId.trim();

  const script = document.createElement('script');
  script.async = true;
  script.src = `${GTAG_SCRIPT_URL}?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  // gtag.js reads the `arguments` object itself, not an array of the arguments.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: false });
}
