# Chronas Frontend

Modern React 19 + Vite 8 + TypeScript frontend shell for the Chronas interactive historical map application.

## Quick Start

Requires Node `^22.22.0 || ^24.0.0 || >=26.0.0` (CI uses 24). Create `.env.development` first
(see [Environment Configuration](#environment-configuration)); the app does not start without it.

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Type-check with `tsc` |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Lint code |
| `npm run format` | Format code with Prettier |
| `npm run ci` | Lint, unit tests and build |
| `npm run deploy:prod` | Deploy to production (AWS S3 + CloudFront) |

## Environment Configuration

`.env.staging` and `.env.production` are committed. For local development, create
`.env.development` in the project root (it is gitignored):

```
VITE_API_BASE_URL=https://api.chronas.org/v1
VITE_ENVIRONMENT=development
VITE_ENABLE_DEV_TOOLS=true
```

`VITE_API_BASE_URL` and `VITE_ENVIRONMENT` are required; `VITE_ENABLE_DEV_TOOLS` and
`VITE_GA_MEASUREMENT_ID` are optional. `npm run build` always uses `.env.production`.

## Deployment

Deploy to AWS S3 with CloudFront:

```bash
npm run deploy:prod   # Deploy to production (chronas.org)
```

Production is the only environment confirmed live; pushes to `main` deploy it via GitHub Actions.
`scripts/deploy.ts` also defines development (`npm run deploy`) and staging
(`npm run deploy:staging`) targets, but their S3 buckets aren't in the production AWS account.

Requires AWS CLI configured with the `chronas-prod` profile (`chronas-dev` for the
development and staging targets).

## Tech Stack

- React 19
- Vite 8
- TypeScript 6
- Zustand (state management)
- React Router 8 (HashRouter)
- Axios (API client)
- Vitest + Playwright (testing)
