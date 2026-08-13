# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Katla Support Management - a case/errand management web application for Sundsvalls Kommun. Monorepo with separate `frontend/` and `backend/` directories, each with their own `package.json` and `yarn install`.

## Build & Development Commands

### Frontend (`cd frontend`)
```bash
yarn dev                    # Dev server (Next.js)
yarn build                  # Production build
yarn lint                   # ESLint
yarn type-check             # TypeScript check without emit
yarn test                   # Unit tests (Vitest)
yarn test:watch             # Unit tests in watch mode
yarn test:coverage          # Unit tests with coverage
yarn e2e                    # Playwright e2e tests (requires built app or running dev server)
yarn e2e:ui                 # Playwright interactive UI mode
yarn generate:contracts     # Regenerate API data contracts from swagger
```

### Backend (`cd backend`)
```bash
yarn dev                    # Dev server (nodemon)
yarn build                  # Compile TypeScript (tsc + tsc-alias)
yarn test                   # Unit tests (Vitest)
yarn test:watch             # Unit tests in watch mode
yarn lint                   # ESLint
yarn generate:contracts     # Regenerate API data contracts from swagger
yarn type-check             # TypeScript check without emit
```

## Architecture

### Frontend
- **Next.js 16** with App Router, React 19, TypeScript
- **Routing**: `src/app/[locale]/` — locale-based dynamic routing (default: `sv`)
- **State**: Zustand stores in `src/stores/` (persisted to localStorage/sessionStorage)
- **API layer**: Axios-based services in `src/services/` calling backend endpoints
- **Forms**: React Hook Form + Yup validation; JSON Schema forms via `@rjsf/core`
- **UI library**: `@sk-web-gui/react` (Sundsvalls Kommun design system) + Tailwind CSS
- **i18n**: `i18next` + `react-i18next`, translations in `locales/sv/`
- **Auth**: SAML 2.0 sessions, middleware in `src/proxy.ts` protects routes

### Backend
- **Express.js** with `routing-controllers` (decorator-based controllers in `src/controllers/`)
- **Auth**: Passport.js with SAML 2.0 strategy, session-based
- **External APIs**: SupportManagement, Citizen, Employee, SimulatorServer (via WSO2)
- **Response mapping**: DTOs in `src/responses/` transform external API data

### Data Contracts
Both frontend and backend have `src/data-contracts/` directories with TypeScript types generated from Swagger/OpenAPI specs via `swagger-typescript-api`. Regenerate with `yarn generate:contracts`.

## Path Aliases (Frontend tsconfig)
- `@components/*` → `src/components/*`
- `@services/*` → `src/services/*`
- `@utils/*` → `src/utils/*`
- `@layouts/*` → `src/layouts/*`
- `@data-contracts/*` → `src/data-contracts/*`
- `@contexts/*` → `src/contexts/*`
- `@interfaces/*` → `src/interfaces/*`

## Code Conventions

- **Prettier**: single quotes, 2-space indent, 120 print width, trailing commas (es5), `experimentalTernaries: true`
- **ESLint**: strict, type-aware flat config modeled on Sundsvalls Kommun's web-app-starter — `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked`, `simple-import-sort`, `unused-imports`, `no-console` (warn/error allowed), no `any`, and `noInlineConfig` (inline `eslint-disable` comments are forbidden — fix the code instead). Run `yarn lint:strict` (0 warnings) and `yarn format:check` before pushing; both run in CI.
- **Component naming**: `*.component.tsx` pattern
- **Test selectors**: use `data-cy` attributes (Playwright is configured with `testIdAttribute: 'data-cy'`)
- **Feature flags**: configured in `src/config/appconfig.tsx` via `NEXT_PUBLIC_*` env vars
- **Language**: UI text and comments are in Swedish; code identifiers in English

## Testing

- **Vitest (frontend)**: unit/component tests in `frontend/tests/unit/`, config in `vitest.config.mts`, setup in `tests/setup.ts`
- **Vitest (backend)**: tests in `backend/src/tests/`, config in `vitest.config.mts` (SWC transform for decorator metadata); deterministic test environment in `src/tests/setup.ts`
- **Playwright (frontend)**: e2e tests in `frontend/e2e/tests/`, helpers in `e2e/utils/`, fixtures in `e2e/fixtures/`, config in `playwright.config.ts`; run against a production build (`yarn build && yarn e2e`) or a running dev server
- **Coverage**: Vitest v8 coverage via `yarn test:coverage`
- **CI**: `.github/workflows/ci.yml` runs lint, type-check, unit tests (frontend + backend) and Playwright e2e

## Dependency Maintenance

Security alerts are handled locally with AI support via the `/deps-review` slash command (defined in `.claude/commands/deps-review.md`) — root-cause dependency upgrades over `resolutions`. Dependabot version-update PRs are intentionally not used.

## Environment

- Node 22.18.0 (använd den pinnade versionen i `.nvmrc`; `package.json` anger det stödda intervallet), Yarn
- Frontend env: copy `.env-example` → `.env`
- Backend env: copy `.env.example.local` → `.env.development.local`
