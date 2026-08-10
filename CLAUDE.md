# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Katla Support Management - a case/errand management web application for Sundsvalls Kommun. Monorepo with separate `frontend/` and `backend/` directories, each with their own `package.json` and `yarn install`.

## Build & Development Commands

### Frontend (`cd frontend`)
```bash
yarn dev                    # Dev server (Next.js)
yarn build                  # Production build
yarn lint                   # ESLint (no cache)
yarn type-check             # TypeScript check without emit
yarn jest --watch           # Unit tests in watch mode
yarn jest:coverage          # Unit tests with coverage
yarn cypress                # Cypress interactive (e2e + component)
yarn cypress:headless       # Cypress headless CI mode
yarn test:coverage          # Full test suite with merged coverage
yarn generate:contracts     # Regenerate API data contracts from swagger
```

### Backend (`cd backend`)
```bash
yarn dev                    # Dev server (nodemon)
yarn build                  # Compile TypeScript (tsc + tsc-alias)
yarn test                   # Jest tests
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
- **ESLint**: `@typescript-eslint/no-explicit-any` is an error; `react-refresh/only-export-components` enforced
- **Component naming**: `*.component.tsx` pattern
- **Cypress selectors**: use `data-cy` attributes
- **Feature flags**: configured in `src/config/appconfig.tsx` via `NEXT_PUBLIC_*` env vars
- **Language**: UI text and comments are in Swedish; code identifiers in English

## Testing

- **Jest**: unit/integration tests, config in `jest.config.js`, setup in `jest/setup.js`
- **Cypress**: e2e tests in `cypress/e2e/`, component tests in `cypress/component/`
- **Coverage**: merged from both Jest and Cypress via `istanbul-merge`

## Dependency Maintenance

Security alerts are handled locally with AI support via the `/deps-review` slash command (defined in `.claude/commands/deps-review.md`) — root-cause dependency upgrades over `resolutions`. Dependabot version-update PRs are intentionally not used.

## Environment

- Node >= 22 LTS, Yarn
- Frontend env: copy `.env-example` → `.env`
- Backend env: copy `.env.example.local` → `.env.development.local`
