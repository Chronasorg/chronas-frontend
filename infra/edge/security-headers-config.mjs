/**
 * Security headers for chronas.org (CloudFront E2ZHTJ5XV3DHIV), applied as a
 * CloudFront response headers policy by security-headers.mjs.
 *
 * Added 2026-11 after the pentest (C2: no CSP or X-Frame-Options, login page
 * clickjackable; C6: no HSTS). Every subdomain of chronas.org serves HTTPS
 * (CloudFront or GitHub Pages), so HSTS covers subdomains. No `preload` yet:
 * the preload list is hard to leave again.
 *
 * Compression stays on (pentest C7, BREACH): BREACH needs a secret and
 * attacker-controlled input reflected in the same compressed response. The
 * site is static files from S3 with no cookies, tokens or reflected input
 * (login was removed in 2026-11), so the risk is accepted.
 */

export const DISTRIBUTION_ID = 'E2ZHTJ5XV3DHIV';
/** One response headers policy per mode, so switching modes swaps the attachment. */
export const POLICY_NAMES = {
  'report-only': 'chronas-frontend-security-headers-report-only',
  enforce: 'chronas-frontend-security-headers-enforce',
};
/** The first policy (2026-11-26, report-only); `report-only` renames it. */
export const LEGACY_POLICY_NAME = 'chronas-frontend-security-headers';

/**
 * Everything the site loads from elsewhere. When the site starts using a new
 * host (a basemap, an embed, an API URL), add it here, or the browser blocks it
 * once the CSP is enforced.
 */
const API = ['https://api.chronas.org', 'https://d24mkpax7rmotx.cloudfront.net'];
const BASEMAPS = ['https://tiles.openfreemap.org', 'https://tiles.maps.eox.at'];
/**
 * Google Analytics (gtag.js) is loaded at runtime from www.googletagmanager.com
 * and sends to google-analytics.com. That is a deliberate trust boundary:
 * Google's script runs with the page's rights, and gtag.js can't be pinned or
 * self-hosted in a supported way. It only loads when VITE_GA_MEASUREMENT_ID is
 * set (production). To remove the trust, drop GA: unset the variable and
 * delete these hosts and the googletagmanager entry in script-src.
 */
const ANALYTICS = [
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://*.googletagmanager.com',
];

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https://www.googletagmanager.com'],
  // React and MapLibre set inline style attributes.
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  // Article images, thumbnails and map tiles come from many hosts.
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'connect-src': ["'self'", ...API, ...BASEMAPS, ...ANALYTICS],
  // Wikipedia articles in the right drawer, YouTube videos in the info dialog.
  'frame-src': ['https://*.wikipedia.org', 'https://*.wikimedia.org', 'https://www.youtube.com'],
  // MapLibre starts its workers from blob: URLs.
  'worker-src': ["'self'", 'blob:'],
  'child-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  // Nothing frames chronas.org, not even chronas.org itself.
  'frame-ancestors': ["'none'"],
};

export function cspString(directives = CSP_DIRECTIVES) {
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}

/**
 * The response headers policy. `mode` is 'report-only' (the browser reports
 * CSP violations in the console but blocks nothing) or 'enforce'.
 */
export function policyConfig(mode) {
  if (mode !== 'report-only' && mode !== 'enforce') {
    throw new Error(`mode must be report-only or enforce, not ${mode}`);
  }
  const csp = cspString();
  const customHeaders = [
    {
      Header: 'Permissions-Policy',
      Value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      Override: true,
    },
  ];
  if (mode === 'report-only') {
    customHeaders.push({
      Header: 'Content-Security-Policy-Report-Only',
      Value: csp,
      Override: true,
    });
  }

  const securityHeaders = {
    StrictTransportSecurity: {
      Override: true,
      AccessControlMaxAgeSec: 31536000,
      IncludeSubdomains: true,
      Preload: false,
    },
    FrameOptions: { Override: true, FrameOption: 'DENY' },
    ContentTypeOptions: { Override: true },
    ReferrerPolicy: { Override: true, ReferrerPolicy: 'strict-origin-when-cross-origin' },
  };
  if (mode === 'enforce') {
    securityHeaders.ContentSecurityPolicy = { Override: true, ContentSecurityPolicy: csp };
  }

  return {
    Name: POLICY_NAMES[mode],
    Comment: `chronas.org security headers (CSP ${mode}); infra/edge in chronas-frontend`,
    SecurityHeadersConfig: securityHeaders,
    CustomHeadersConfig: { Quantity: customHeaders.length, Items: customHeaders },
  };
}
