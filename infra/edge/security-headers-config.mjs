/**
 * Security headers for chronas.org (CloudFront E2ZHTJ5XV3DHIV), applied as a
 * CloudFront response headers policy by security-headers.mjs.
 *
 * Added 2026-11 after the pentest (C2: no CSP or X-Frame-Options, login page
 * clickjackable; C6: no HSTS). Every subdomain of chronas.org serves HTTPS
 * (CloudFront or GitHub Pages), so HSTS covers subdomains. No `preload` yet:
 * the preload list is hard to leave again.
 */

export const DISTRIBUTION_ID = 'E2ZHTJ5XV3DHIV';
export const POLICY_NAME = 'chronas-frontend-security-headers';

/**
 * Everything the site loads from elsewhere. When the site starts using a new
 * host (a basemap, an embed, an API URL), add it here, or the browser blocks it
 * once the CSP is enforced.
 */
const API = ['https://api.chronas.org', 'https://d24mkpax7rmotx.cloudfront.net'];
const BASEMAPS = ['https://tiles.openfreemap.org', 'https://tiles.maps.eox.at'];
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
  'frame-ancestors': ["'self'"],
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
    FrameOptions: { Override: true, FrameOption: 'SAMEORIGIN' },
    ContentTypeOptions: { Override: true },
    ReferrerPolicy: { Override: true, ReferrerPolicy: 'strict-origin-when-cross-origin' },
  };
  if (mode === 'enforce') {
    securityHeaders.ContentSecurityPolicy = { Override: true, ContentSecurityPolicy: csp };
  }

  return {
    Name: POLICY_NAME,
    Comment: `chronas.org security headers (CSP ${mode}); infra/edge in chronas-frontend`,
    SecurityHeadersConfig: securityHeaders,
    CustomHeadersConfig: { Quantity: customHeaders.length, Items: customHeaders },
  };
}
