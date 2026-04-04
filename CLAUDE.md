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

## Architecture

**Stack:** React 19, TypeScript 5.7 (strict), Vite 6, Zustand 5, React Router 6 (HashRouter)

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

## Path Alias

`@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).

## Testing

- **Unit/integration:** Vitest + React Testing Library. Tests live alongside source as `*.test.ts` / `*.spec.tsx`.
- **Property-based:** fast-check library, files named `*.property.test.ts`.
- **E2E:** Playwright (Chromium only), tests in `tests/e2e/`.
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

AWS S3 + CloudFront. Script at `scripts/deploy.ts` syncs `dist/` to environment-specific buckets using `chronas-dev` AWS profile. Distribution IDs cached in `.deploy-config.json`.
