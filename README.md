# Chronas Frontend

Modern React 19 + Vite 7 + TypeScript frontend shell for the Chronas interactive historical map application.

## Quick Start

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
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Lint code |
| `npm run format` | Format code with Prettier |
| `npm run deploy` | Deploy to AWS S3 |

## Environment Configuration

Create environment files in the project root:

- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

Required variables:
```
VITE_API_BASE_URL=http://localhost:3030/v1
VITE_ENVIRONMENT=development
VITE_ENABLE_DEV_TOOLS=true
```

## Deployment

Deploy to AWS S3 with CloudFront:

```bash
npm run deploy              # Deploy to development
npm run deploy staging      # Deploy to staging
npm run deploy production   # Deploy to production
```

Requires AWS CLI configured with `chronas-dev` profile.

## Tech Stack

- React 19
- Vite 7
- TypeScript 5
- Zustand (state management)
- React Router v6 (HashRouter)
- Axios (API client)
- Vitest + Playwright (testing)
