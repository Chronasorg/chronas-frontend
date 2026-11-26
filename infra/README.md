# infra: chronas.org edge and DNS

Scripts for the parts of chronas.org that live outside the S3 bucket. Each is a
dry run unless called with `--apply --confirm "<phrase>"`, uses the
`chronas-prod` profile (`CHRONAS_AWS_PROFILE` overrides it; `AWS_PROFILE` is
ignored on purpose), refuses any account but `937826731833`, and saves the
state it changes to `infra/backups/` (gitignored) first. Never use CDK for
these (`chronas-cdk` is retired).

## Security headers: `edge/`

CloudFront `E2ZHTJ5XV3DHIV` (chronas.org, `*.chronas.org`) sends these headers
through a response headers policy on the default behavior. Added 2026-11
after the pentest (C2, C6).

| Header                                        | Value                                                          |
| --------------------------------------------- | -------------------------------------------------------------- |
| `Strict-Transport-Security`                   | `max-age=31536000; includeSubDomains` (no `preload`)           |
| `Content-Security-Policy` (or `-Report-Only`) | from `CSP_DIRECTIVES` in `edge/security-headers-config.mjs`    |
| `X-Frame-Options`                             | `DENY` (and `frame-ancestors 'none'` in the CSP)               |
| `X-Content-Type-Options`                      | `nosniff`                                                      |
| `Referrer-Policy`                             | `strict-origin-when-cross-origin`                              |
| `Permissions-Policy`                          | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |

There is one policy per mode: `chronas-frontend-security-headers-report-only`
(the CSP is sent as `Content-Security-Policy-Report-Only`: the browser reports
violations as `securitypolicyviolation` events and in DevTools, and blocks
nothing) and `chronas-frontend-security-headers-enforce`. Applying a mode
updates that mode's policy and attaches it, so going back from enforce is
`report-only --apply`.

```bash
node infra/edge/security-headers.mjs enforce        # dry run: shows the policy
node infra/edge/security-headers.mjs enforce --apply --confirm "apply chronas.org security headers"
node infra/edge/security-headers.mjs report-only --apply --confirm "apply chronas.org security headers"
node infra/edge/security-headers.mjs restore infra/backups/<snapshot>.json --apply --confirm "restore chronas.org security headers"
```

Every run first saves a snapshot to `infra/backups/`: the distribution config
and the full config of every chronas.org security headers policy. `restore`
puts a snapshot back, first the policies' contents, then the distribution.

**When the site loads something new** (a basemap, an embed, an API host, an
analytics endpoint), add its origin to `CSP_DIRECTIVES`, try it with
`report-only`, and apply before the frontend deploy that uses it; with the CSP
enforced the browser blocks anything not listed. Inline `<script>` is not
allowed: put scripts in the bundle (Google Analytics is loaded by
`src/analytics/googleAnalytics.ts`).

### Accepted risks

- **Google Analytics runs Google's code.** gtag.js is loaded at runtime from
  `www.googletagmanager.com` (allowed in `script-src`) and can't be pinned or
  self-hosted in a supported way, so it runs with the page's rights. It only
  loads when `VITE_GA_MEASUREMENT_ID` is set (production). To remove this
  trust, drop GA: unset the variable and remove the Google hosts from the CSP.
- **Compression stays on (C7, BREACH).** BREACH needs a secret and
  attacker-controlled input in the same compressed response. The site is
  static files with no cookies, tokens or reflected input.
- **`POST` over plain HTTP answers 200** with `index.html`: CloudFront's 403
  for a method the behavior doesn't allow goes through the SPA rule
  403 → `/index.html`. With HSTS browsers don't send it; a CloudFront Function
  to answer 405 would add cost.

Every subdomain must keep serving HTTPS: HSTS covers subdomains, so browsers
refuse plain HTTP on any of them for a year.

## Mail and CAA records: `dns/`

Route 53 zone `Z005461139KF8GDMY491N`. Added 2026-11 after the pentest (C4, R15).

| Record                   | Value                                               | Why                                                                                |
| ------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `chronas.org TXT`        | `v=spf1 -all`                                       | no server may send mail as @chronas.org                                            |
| `_dmarc.chronas.org TXT` | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s`    | receivers reject such mail                                                         |
| `chronas.org CAA`        | `0 issue "amazon.com"`, `0 issue "letsencrypt.org"` | ACM (CloudFront certificate) and Let's Encrypt (GitHub Pages, spoken-history) only |

```bash
node infra/dns/mail-and-caa.mjs                      # dry run
node infra/dns/mail-and-caa.mjs --apply --confirm "apply chronas.org mail and CAA records"
```

chronas.org has no MX record and sends no mail. Before anything sends mail as
@chronas.org, add the sender to SPF and publish its DKIM key, or that mail is
rejected. A certificate from another CA needs that CA in the CAA record first.
The script only creates records; it fails if one already exists. Change them
later in Route 53 directly or extend the script.
