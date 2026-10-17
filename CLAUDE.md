# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (port 5173) |
| Build | `npm run build` |
| Preview build | `npm run preview` (port 4173) |
| Lint | `npm run lint` / `npm run lint:fix` |
| Format | `npm run format` / `npm run format:check` |
| Typecheck | `npm run typecheck` |
| All tests | `npm test` |
| Watch tests | `npm run test:watch` |
| Single test file | `npx vitest run src/path/to/file.test.ts` |
| Test coverage | `npm run test:coverage` |
| E2E tests | `npm run test:e2e` |
| E2E UI mode | `npm run test:e2e:ui` |
| E2E against a deployed site | `BASE_URL=<url> npm run test:deploy`. Always set `BASE_URL`: the hard-coded default `d1q6nlczw9cdpt.cloudfront.net` is not a distribution in the prod account, and the `DEPLOY_ENV` set by the `:staging`/`:prod` variants is never read. |
| Full CI check | `npm run ci` (lint + test + build; `npm run verify` is identical) |
| CI check + E2E | `npm run ci:full` |
| Deploy (dev) | `npm run deploy` |
| Deploy (staging) | `npm run deploy:staging` |
| Deploy (prod) | `npm run deploy:prod` |

**Node:** `^22.22.0 || ^24.0.0 || >=26.0.0` (CI uses 24 LTS). The floor comes from
`react-router` 8 (`>=22.22.0`); vitest 5 excludes the odd releases 23 and 25.

## Architecture

**Stack:** React 19, TypeScript 6 (strict), Vite 8, Zustand 5, React Router 8 (`react-router`, HashRouter)

**What the app does:** Chronas is a historical map application. Users explore an interactive map (MapLibre GL via react-map-gl) with a timeline (vis-timeline) to navigate through historical periods. Areas and markers on the map link to content displayed in a right drawer panel.

### State Management (Zustand stores in `src/stores/`)

- **authStore** — JWT auth, user session. Token stored in `localStorage` as `chs_token`.
- **mapStore** — Map viewport, color dimensions, area/marker data, GeoJSON metadata.
- **timelineStore** — Current year, epic items, autoplay config.
- **uiStore** — Theme, locale, drawer state (right drawer shows area/marker content).
- **navigationStore** — Left menu drawer (open state, `layers`/`collections`/`settings` content) and active nav item.
- **loadingStore** — Async loading state.

Stores export typed hooks (`useMapStore`, …) and their State/Actions types, not selector functions. Select fields inline (e.g. `useMapStore((s) => s.viewport)`) to avoid unnecessary re-renders.

### Routing & URL State

HashRouter with routes defined in `src/routes/`. Year, area/marker selection (`type`, `value`), map position (`pos`), `color`, `epics` and `markersOff` are query params in the hash (`/#/?year=1000&type=area&value=Athens`) so they can be shared/bookmarked. See `src/utils/urlStateUtils.ts` and `src/utils/mapUtils.ts` (`updateQueryStringParameter`, `updateYearInURL`, `updatePositionInURL`); `src/utils/yearUtils.ts` only clamps, validates and formats years.

### API Layer (`src/api/`)

Axios client with JWT Bearer token injection (request interceptor). On a 401 the response interceptor clears the auth store and opens the login dialog (`useUIStore.getState().openLoginDialog()`); it does not redirect. Endpoints defined in `endpoints.ts`. 30s timeout.

### Map Visualization

- **react-map-gl** (`react-map-gl/maplibre`) wraps **MapLibre GL JS** for the base map
- Basemap styles are keyless (`BASEMAP_STYLES` in `src/stores/mapStore.ts`): `topographic`
  is a vendored, patched copy of OpenFreeMap's `liberty` (`public/styles/liberty.json`; its
  tiles and sprites still come from OpenFreeMap), `light` is OpenFreeMap's hosted `positron`
  (fetched at runtime), and `satellite`/`none` are local JSON in `public/styles/`. Glyphs for
  Chronas's own layers are self-hosted in `public/fonts/`. No access token is needed
  anywhere — see issue #46 and `docs/adr/0001-openfreemap-hosted-basemaps.md`.
- All overlays (province fills/borders, hover highlight, markers from the icon atlas in
  `public/images/`, clusters, labels, entity outline) are MapLibre layers declared with
  `<Source>`/`<Layer>` in `src/components/map/MapView/MapView.tsx`.
  `src/components/map/DeckGLOverlay/` (deck.gl) is not mounted anywhere.
- **@turf/turf** for geospatial computations
- Map theme config in `src/config/mapTheme.ts`

### Internationalization

i18next via react-i18next. Setup in `src/i18n/`. Locale preference managed by uiStore.

**Subdomain locale detection:** When the app loads on a language subdomain (e.g. `de.chronas.org`), `getSubdomainLocale()` in `src/i18n/i18n.ts` parses the hostname and sets the initial locale automatically. Subdomain locale takes precedence over the localStorage-persisted preference. Supported codes are validated against `SUPPORTED_LANGUAGES`.

## Path Alias

`@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).

## Testing

- **Unit/integration:** Vitest + React Testing Library. Tests live alongside source as `*.test.ts` / `*.test.tsx`.
- **Property-based:** fast-check library, files named `*.property.test.ts` / `*.property.test.tsx`.
- **E2E:** Playwright (Chromium only), tests in `tests/e2e/`.
  - **Comprehensive UI suite:** `tests/e2e/comprehensive-ui.spec.ts` — 43 tests (2026-10-13) covering navigation sidebar (incl. the Info dialog and Support page), layers panel (area dimensions, marker filters, advanced section, section collapse/expand), settings panel (theme, language, detail level), right drawer, timeline controls, announcement banner, and keyboard accessibility. Epic-filter tests are in `epic-items.spec.ts`.
  - **Other E2E suites:** `navigation.spec.ts`, `layer-controls.spec.ts`, `map-interactions.spec.ts`, `marker-features.spec.ts`, `timeline-interactions.spec.ts`, etc.
- **Setup file:** `tests/setup.ts` — mocks localStorage, atob/btoa, and environment.
- **Mocks:** `tests/__mocks__/` — react-map-gl is mocked in unit tests.

## Code Style

- Prettier: single quotes, semicolons, 2-space indent, 100 char width, trailing commas (es5).
- ESLint: strict TypeScript rules, enforces `interface` over `type`, inline type imports.
- Test files have relaxed lint rules (no explicit `any` warnings, etc.).

## Environment Variables

Required: `VITE_API_BASE_URL`, `VITE_ENVIRONMENT` (development|staging|production).
Optional: `VITE_ENABLE_DEV_TOOLS`, `VITE_GA_MEASUREMENT_ID`.
Validated at startup in `src/config/env.ts` (the app throws if a required var is missing).
`VITE_GA_MEASUREMENT_ID` is not validated; it is substituted into `index.html`, which loads
Google Analytics only when it is set.

## Deployment

**Infrastructure:** AWS S3 + CloudFront, region `eu-west-1`, account `937826731833`.

**Deploy script:** `scripts/deploy.ts` — builds the app, syncs `dist/` to S3, and invalidates the CloudFront cache. It auto-creates the bucket and a CloudFront distribution if they don't exist (an auto-created distribution has no aliases or certificate). Distribution IDs are cached in `.deploy-config.json`, which is gitignored and local only; CI finds the distribution by its S3 origin instead. The production bucket also holds chronas-api's `api/statistics.json`. The `--delete` sync excludes `api/*`; keep that exclude, or every deploy wipes the API's statistics (`GET /v1/statistics` → 503).

### Environments

Production is the only environment confirmed live. `deploy.ts` also defines development and
staging targets, but their buckets aren't in the prod account `937826731833`, and the
`chronas-dev` profile they use isn't configured on the maintainer machine (checked 2026-10-13).
They may belong to the second account `704516356990` behind the `chronas` SSO profile, which
wasn't checked. Running them fails the credential check until a `chronas-dev` profile exists.

| Environment | Command | AWS Profile | S3 Bucket | Status |
|-------------|---------|-------------|-----------|--------|
| Development | `npm run deploy` | `chronas-dev` | `chronas-frontend-dev` | Not in prod account |
| Staging | `npm run deploy:staging` | `chronas-dev` | `chronas-frontend-staging` | Not in prod account |
| Production | `npm run deploy:prod` | `chronas-prod` | `chronas-frontend-new` | Live at `chronas.org` |

`deploy.ts` always runs a plain `npm run build` (Vite mode `production`), so every target is
built from `.env.production`, including its API URL and `VITE_ENVIRONMENT=production`.

### CloudFront Distributions

| Distribution | ID | Domain | Aliases | S3 Origin | Serves |
|---|---|---|---|---|---|
| **Production** | `E2ZHTJ5XV3DHIV` | `d3bfof98puvj92.cloudfront.net` | `chronas.org`, `*.chronas.org` | `chronas-frontend-new` | New frontend (main site + all subdomains) |
| **Legacy** | `E3V9JG5DMH4162` | `d2ou8t1mjzx1m7.cloudfront.net` | `old.chronas.org` | `chronas-frontend-937826731833` | Old/classic frontend |

Production reads the bucket through its S3 REST endpoint (`chronas-frontend-new.s3.eu-west-1.amazonaws.com`) with Origin Access Control `E2JQAMJMCGV5PY` (SigV4). Legacy uses the bucket's S3 website endpoint (`chronas-frontend-937826731833.s3-website-eu-west-1.amazonaws.com`) as a custom origin, without OAC. Both map 403/404 → `/index.html` (200) for SPA routing (checked 2026-10-13).

### DNS (Route53)

Hosted zone: `chronas.org` (ID: `Z005461139KF8GDMY491N`)

| Record | Type | Target |
|---|---|---|
| `chronas.org` | A (alias) | `d3bfof98puvj92.cloudfront.net` (production dist) |
| `old.chronas.org` | CNAME | `d2ou8t1mjzx1m7.cloudfront.net` (legacy dist) |
| `www.chronas.org` | CNAME | `d3bfof98puvj92.cloudfront.net` |
| `api.chronas.org` | A (alias) | API Gateway (`d-hghcknax0i.execute-api.eu-west-1.amazonaws.com`) |
| **Language subdomains** | CNAME | `d3bfof98puvj92.cloudfront.net` |
| **Special subdomains** | CNAME | `d3bfof98puvj92.cloudfront.net` |

**Language subdomains** (all point to production dist): `ar`, `ca`, `de`, `el`, `en`, `es`, `fr`, `hi`, `it`, `ja`, `nl`, `pl`, `pt`, `ru`, `sv`, `tr`, `vi`, `zh`

**Special subdomains** (all point to production dist): `adtest`, `edu`, `light`, `play`, `us`

When a user visits e.g. `de.chronas.org`, the app's subdomain locale detection (`src/i18n/i18n.ts`) automatically sets the locale to German.

`api.chronas.org` points straight at API Gateway; the app calls the API through its CloudFront domain instead (see Production URLs).

### SSL Certificate

- **ARN:** `arn:aws:acm:us-east-1:937826731833:certificate/b9685497-6e5f-4965-ab54-7f1ea1aee8ec`
- **Domains:** `chronas.org`, `*.chronas.org` (wildcard)
- **Expires:** 2027-02-26 (ACM-managed, auto-renewed; checked 2026-10-13)
- **Used by** three CloudFront distributions: production `E2ZHTJ5XV3DHIV`, legacy `E3V9JG5DMH4162`, and the API's `E1KTIK2H0W8J2Q`

### CI/CD (GitHub Actions)

Both workflows use Node 24. Neither runs E2E tests.

Workflow at `.github/workflows/ci.yml`:
- **Trigger:** Pull requests to `main`
- **Steps:** `npm ci` → `npm run lint` → `npm run typecheck` → `npm test` → `npm run build`
- **Concurrency:** A newer push to the same PR cancels the running check

Workflow at `.github/workflows/deploy-prod.yml`:
- **Trigger:** Push to `main` branch
- **Steps:** `npm ci` → `npm run lint` → `npm test` → `npm run deploy:prod` (which runs the build)
- **Concurrency:** Group `deploy-prod` with `cancel-in-progress: true` — a newer push cancels a deploy that is still running
- **Secrets required:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (static keys in GitHub repo secrets, written to a `chronas-prod` profile in `eu-west-1`; no OIDC)

### Env files

- `.env.development` — `npm run dev` and the Playwright web server (not committed, create manually)
- `.env.production` — committed even though `.gitignore` lists it; loaded by every `npm run build`, so by all deploy targets
- `.env.staging` — also committed, but not loaded by any script; its `api-staging.chronas.org` host has no DNS record
- `.env.dev-deploy` — gitignored and not loaded by any script

### Cache strategy

- `index.html`: `max-age=0, must-revalidate` (always fresh)
- Everything else in `dist/`: `max-age=31536000, immutable`. That includes the un-hashed files
  copied from `public/` (`styles/*.json`, `fonts/`, `images/`), not just fingerprinted
  `assets/*`, so browsers can keep an edited un-hashed file for up to a year. Rename it
  rather than editing it in place.
- CloudFront `/*` invalidation runs on every deploy (it clears the edge cache, not browser caches)

### Production URLs

- **App:** `https://chronas.org` (served via CloudFront distribution `E2ZHTJ5XV3DHIV`)
- **API:** `https://d24mkpax7rmotx.cloudfront.net/v1` (the API's CloudFront edge cache, set in `.env.production`). `https://api.chronas.org/v1` points straight at API Gateway and is not used by the app.
- **Legacy frontend:** `https://old.chronas.org` (served via CloudFront distribution `E3V9JG5DMH4162`)

## Completion Checklist

**Before reporting any task as finished, always run the following steps:**

1. `npm run lint` — ensure no lint errors
2. `npm run typecheck` — ensure no type errors
3. `npm test` — ensure the unit tests pass
4. `npm run build` — ensure the build succeeds (steps 1–4 are what `ci.yml` runs on pull requests)
5. `npm run test:e2e -- tests/e2e/comprehensive-ui.spec.ts` — run the comprehensive Playwright E2E test suite
6. **MCP browser verification** — use the Playwright MCP server to walk through `tests/BROWSER_SANITY_CHECK.md` against the running app (`http://localhost:5173`), validating all sections relevant to the change

If Playwright browsers are not installed, run `npx playwright install chromium` first.

### Visual Verification

Use Playwright headless browser to take screenshots after any frontend change:

```bash
# Screenshot local dev (wait for map/content to load)
npx playwright screenshot --browser chromium --wait-for-timeout 5000 "http://localhost:5173" /tmp/screenshot.png --viewport-size "1400,900"

# Screenshot production for comparison
npx playwright screenshot --browser chromium --wait-for-timeout 5000 "https://chronas.org" /tmp/prod-screenshot.png --viewport-size "1400,900"
```
