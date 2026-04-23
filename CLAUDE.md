# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (port 5173) |
| Build | `npm run build` |
| Lint | `npm run lint` / `npm run lint:fix` |
| Format | `npm run format` / `npm run format:check` |
| Typecheck | `npm run typecheck` |
| All tests | `npm test` |
| Watch tests | `npm run test:watch` |
| Single test file | `npx vitest run src/path/to/file.test.ts` |
| Test coverage | `npm run test:coverage` |
| E2E tests | `npm run test:e2e` |
| E2E UI mode | `npm run test:e2e:ui` |
| Full CI check | `npm run ci` (lint + test + build) |
| Deploy (dev) | `npm run deploy` |
| Deploy (staging) | `npm run deploy:staging` |
| Deploy (prod) | `npm run deploy:prod` |

## Architecture

**Stack:** React 19, TypeScript 6 (strict), Vite 8, Zustand 5, React Router 7 (HashRouter)

**What the app does:** Chronas is a historical map application. Users explore an interactive map (Deck.gl + Mapbox GL) with a timeline (vis-timeline) to navigate through historical periods. Areas and markers on the map link to content displayed in a right drawer panel.

### State Management (Zustand stores in `src/stores/`)

- **authStore** — JWT auth, user session. Token stored in `localStorage` as `chs_token`.
- **mapStore** — Map viewport, color dimensions, area/marker data, GeoJSON metadata.
- **timelineStore** — Current year, epic items, autoplay config.
- **uiStore** — Theme, locale, drawer state (right drawer shows area/marker content).
- **navigationStore** — Navigation state.
- **loadingStore** — Async loading state.

Stores export typed selectors. Use precise Zustand selectors to avoid unnecessary re-renders.

### Routing & URL State

HashRouter with routes defined in `src/routes/`. Year, area, and marker selection are encoded in the URL hash so they can be shared/bookmarked. See `src/utils/urlStateUtils.ts` and `src/utils/yearUtils.ts`.

### API Layer (`src/api/`)

Axios client with JWT Bearer token injection (request interceptor) and 401 redirect handling (response interceptor). Endpoints defined in `endpoints.ts`. 30s timeout.

### Map Visualization

- **react-map-gl** wraps Mapbox GL for the base map
- **Deck.gl** provides GeoJSON overlay layers
- **@turf/turf** for geospatial computations
- Map theme config in `src/config/mapTheme.ts`

### Internationalization

i18next via react-i18next. Setup in `src/i18n/`. Locale preference managed by uiStore.

**Subdomain locale detection:** When the app loads on a language subdomain (e.g. `de.chronas.org`), `getSubdomainLocale()` in `src/i18n/i18n.ts` parses the hostname and sets the initial locale automatically. Subdomain locale takes precedence over the localStorage-persisted preference. Supported codes are validated against `SUPPORTED_LANGUAGES`.

## Path Alias

`@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).

## Testing

- **Unit/integration:** Vitest + React Testing Library. Tests live alongside source as `*.test.ts` / `*.spec.tsx`.
- **Property-based:** fast-check library, files named `*.property.test.ts`.
- **E2E:** Playwright (Chromium only), tests in `tests/e2e/`.
  - **Comprehensive UI suite:** `tests/e2e/comprehensive-ui.spec.ts` — 39 tests covering navigation sidebar, layers panel (area dimensions, marker filters, epic filters, advanced section), settings panel, right drawer, timeline controls, announcement banner, keyboard accessibility, and section collapse/expand.
  - **Other E2E suites:** `navigation.spec.ts`, `layer-controls.spec.ts`, `map-interactions.spec.ts`, `marker-features.spec.ts`, `timeline-interactions.spec.ts`, etc.
- **Setup file:** `tests/setup.ts` — mocks localStorage, atob/btoa, and environment.
- **Mocks:** `tests/__mocks__/` — react-map-gl is mocked in unit tests.

## Code Style

- Prettier: single quotes, semicolons, 2-space indent, 100 char width, trailing commas (es5).
- ESLint: strict TypeScript rules, enforces `interface` over `type`, inline type imports.
- Test files have relaxed lint rules (no explicit `any` warnings, etc.).

## Environment Variables

Required: `VITE_API_BASE_URL`, `VITE_ENVIRONMENT` (development|staging|production).
Optional: `VITE_ENABLE_DEV_TOOLS`, `VITE_MAPBOX_TOKEN`.
Validated at startup in `src/config/env.ts`.

## Deployment

**Infrastructure:** AWS S3 + CloudFront, region `eu-west-1`, account `937826731833`.

**Deploy script:** `scripts/deploy.ts` — builds the app, syncs `dist/` to S3, and invalidates the CloudFront cache. It auto-creates buckets and CloudFront distributions if they don't exist. Distribution IDs are cached in `.deploy-config.json`.

### Environments

| Environment | Command | AWS Profile | S3 Bucket | API URL |
|-------------|---------|-------------|-----------|---------|
| Development | `npm run deploy` | `chronas-dev` | `chronas-frontend-dev` | `https://api.chronas.org/v1` |
| Staging | `npm run deploy:staging` | `chronas-dev` | `chronas-frontend-staging` | `https://api-staging.chronas.org/v1` |
| Production | `npm run deploy:prod` | `chronas-prod` | `chronas-frontend-new` | `https://api.chronas.org/v1` |

### CloudFront Distributions

| Distribution | ID | Domain | Aliases | S3 Origin | Serves |
|---|---|---|---|---|---|
| **Production** | `E2ZHTJ5XV3DHIV` | `d3bfof98puvj92.cloudfront.net` | `chronas.org`, `*.chronas.org` | `chronas-frontend-new` | New frontend (main site + all subdomains) |
| **Legacy** | `E3V9JG5DMH4162` | `d2ou8t1mjzx1m7.cloudfront.net` | `old.chronas.org` | `chronas-frontend-937826731833` | Old/classic frontend |

Both distributions use Origin Access Control (OAC) with SigV4 signing. Custom error responses map 403/404 → `index.html` for SPA routing.

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

### SSL Certificate

- **ARN:** `arn:aws:acm:us-east-1:937826731833:certificate/b9685497-6e5f-4965-ab54-7f1ea1aee8ec`
- **Domains:** `chronas.org`, `*.chronas.org` (wildcard)
- **Expires:** 2026-10-10
- **Shared** by both CloudFront distributions

### CI/CD (GitHub Actions)

Workflow at `.github/workflows/deploy-prod.yml`:
- **Trigger:** Push to `main` branch
- **Steps:** `npm ci` → `npm run lint` → `npm test` → `npm run deploy:prod`
- **Concurrency:** Only one deploy runs at a time (`cancel-in-progress: true`)
- **Secrets required:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (configured as GitHub repo secrets, uses `chronas-prod` profile)

### Env files

- `.env.development` — local dev (not committed, create manually)
- `.env.staging` — staging builds
- `.env.production` — production builds

### Cache strategy

- `index.html`: `max-age=0, must-revalidate` (always fresh)
- `assets/*.js`, `*.css`, etc.: `max-age=31536000, immutable` (fingerprinted, long-cached)
- CloudFront `/*` invalidation runs on every deploy

### Production URLs

- **App:** `https://chronas.org` (served via CloudFront distribution `E2ZHTJ5XV3DHIV`)
- **API:** `https://api.chronas.org/v1`
- **Legacy frontend:** `https://old.chronas.org` (served via CloudFront distribution `E3V9JG5DMH4162`)

## Completion Checklist

**Before reporting any task as finished, always run the following steps:**

1. `npm run lint` — ensure no lint errors
2. `npm run build` — ensure the build succeeds
3. `npm run test:e2e -- tests/e2e/comprehensive-ui.spec.ts` — run the comprehensive Playwright E2E test suite
4. **MCP browser verification** — use the Playwright MCP server to walk through `tests/BROWSER_SANITY_CHECK.md` against the running app (`http://localhost:5173`), validating all sections relevant to the change

If Playwright browsers are not installed, run `npx playwright install chromium` first.

### Visual Verification

Use Playwright headless browser to take screenshots after any frontend change:

```bash
# Screenshot local dev (wait for map/content to load)
npx playwright screenshot --browser chromium --wait-for-timeout 5000 "http://localhost:5173" /tmp/screenshot.png --viewport-size "1400,900"

# Screenshot production for comparison
npx playwright screenshot --browser chromium --wait-for-timeout 5000 "https://chronas.org" /tmp/prod-screenshot.png --viewport-size "1400,900"
```
