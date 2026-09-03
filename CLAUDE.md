# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Katla Alkohol- och tobakstillstånd (AoT) - a citizen-facing web application for applying for alcohol serving permits (serveringstillstånd) for Sundsvalls Kommun. Monorepo with separate `frontend/` and `backend/` directories, each with their own `package.json` and `yarn install`.

The frontend never calls Sundsvall's APIs directly. The backend is a BFF: it holds the SAML session, exchanges credentials for WSO2 tokens, and maps upstream responses to DTOs. Anything the UI needs must exist as a backend endpoint first.

## Build & Development Commands

### Frontend (`cd frontend`)
```bash
yarn dev                    # Dev server (Next.js, körs med TEST=true)
yarn build                  # Production build (standalone output)
yarn lint                   # ESLint (src/, e2e/, tests/)
yarn lint:strict            # Som CI: 0 varningar
yarn format:check           # Som CI: verifiera prettier-formatering
yarn type-check             # tsc för src, tests och e2e (tre tsconfig-projekt)
yarn test                   # Unit tests (Vitest)
yarn test:watch             # Unit tests in watch mode
yarn test:coverage          # Unit tests with coverage
yarn e2e                    # Playwright (startar själv `yarn dev` som testharness)
yarn e2e:ui                 # Playwright interactive UI mode
yarn generate:contracts     # Regenerate API data contracts from backend swagger
```

`dev`, `build`, `lint*` och `type-check` har pre-script som kör `generate:middleware-envs`, vilket skriver den gitignorerade `frontend/middleware-envs.js` från `.env`/`.env.local`. `src/proxy.ts` (Next-middlewaren) importerar den — env-variabler kan inte läsas där. Ändrar du `.env` måste ett av dessa kommandon köras om innan middleware-beteendet ändras.

### Backend (`cd backend`)
```bash
yarn dev                    # Dev server (nodemon + ts-node)
yarn build                  # Compile TypeScript (tsc + tsc-alias)
yarn test                   # Unit tests (Vitest)
yarn test:watch             # Unit tests in watch mode
yarn lint / lint:strict     # ESLint (strict = 0 varningar, som CI)
yarn format:check           # Som CI
yarn type-check             # tsc för src och tsconfig.test.json
yarn generate:contracts     # Regenerate API data contracts from WSO2 swagger
```

### Köra enskilda tester
```bash
yarn test path/to/file.test.ts          # Vitest: filter på sökväg
yarn test -t "namn på testet"           # Vitest: filter på testnamn
yarn e2e e2e/tests/oversikt.spec.ts     # Playwright: en spec-fil
yarn e2e -g "namn på scenariot"         # Playwright: filter på testnamn
```

## Architecture

### Frontend
- **Next.js 16** with App Router, React 19, TypeScript
- **Routing**: `src/app/[locale]/` — locale-based dynamic routing (`sv` default, `en` finns)
- **Auth**: `src/proxy.ts` är Next-middlewaren. Den slår upp skyddade rutter (utan språkprefix, via `pathWithoutLocale`), anropar backendens `/me` med sessionskakan och redirectar till `/login?path=…` vid 401. Klientsidans motsvarighet ligger i `handleError` i `src/services/api-service.ts`.
- **API layer**: alla anrop går genom `apiService` i `src/services/api-service.ts` (axios, `withCredentials`, central 401-hantering). Domänservices i `src/services/*` bygger ovanpå den.
- **State**: Zustand stores in `src/stores/` (persisted to localStorage/sessionStorage)
- **Forms**: React Hook Form + Yup validation; JSON Schema forms via `@rjsf/core`
- **UI library**: `@sk-web-gui/react` (Sundsvalls Kommun design system) + Tailwind CSS. Finns MCP-servern `sk-web-gui` (stilguide.sundsvall.dev) konfigurerad, använd den för props och design tokens i stället för att gissa.
- **i18n**: `i18next` + `react-i18next` + `next-i18n-router`; namnrymder som JSON-filer i `locales/sv/` och `locales/en/`. `src/app/i18nConfig.ts` har `localeDetector: false` med flit — språk är ett aktivt val som sparas i `NEXT_LOCALE`-kakan, eftersom delar av innehållet bara finns på svenska från API:erna. Nya texter måste läggas till i **båda** språkfilerna.
- **Feature flags**: `src/config/appconfig.tsx` läser `NEXT_PUBLIC_*` strikt som `=== 'true'` — en osatt flagga är alltså av, inte neutral.

### Backend
- **Express.js** with `routing-controllers` (decorator-based controllers in `src/controllers/`), bootstrappad i `src/app.ts`
- **Auth**: Passport.js med SAML 2.0 (`@node-saml/passport-saml`), sessionsbaserad. Roller/behörighet i `src/services/authorization.service.ts`.
- **Sessionskaka**: `SESSION_COOKIE_PATH` måste täcka hela appens monteringsrot, inte bara API-prefixet — Next-middlewaren läser samma kaka på UI-vägar. Fel path ger en oändlig loop tillbaka till `/login` trots giltig session (se kommentaren i `src/app.ts`).
- **Utgående anrop**: `src/services/api.service.ts` är enda vägen ut. Den hämtar WSO2-token via `api-token.service.ts` och validerar att den slutliga URL:en ligger innanför den konfigurerade servicebasen (skydd mot punktsegmentsflykt, inklusive flerlagers-URL-avkodning). Uppströms 4xx propageras bara med `propagateClientError` och aldrig med upstream-bodyn.
- **Externa APIer**: listade med version i `src/config/api-config.ts` — det är källan, inte README. Innehåller även en tillfällig alias-routing `supportmanagement` → `supportmanagement-sprint` som ska tas bort när sprint-API:et pensioneras.
- **Response mapping**: DTOs in `src/responses/` transform external API data. JSON Schema-texter lokaliseras serverside (`x-i18n` i ui-schemat löses upp i `schema.controller.ts` utifrån `Accept-Language`) så att frontend aldrig ser övriga språk.

### Data Contracts
Two generated layers, båda i `src/data-contracts/`:
- **Backend** genererar från WSO2: `${API_BASE_URL}/{api}/{version}/api-docs`, en katalog per API i `api-config.ts`.
- **Frontend** genererar från backendens egen `${NEXT_PUBLIC_API_URL}/swagger.json` — backend måste alltså vara igång med `SWAGGER_ENABLED=true` när `yarn generate:contracts` körs i frontend.

Generated files are not hand-edited; ändra mappningen i backendens DTO:er i stället.

## Path Aliases

Frontend (`tsconfig.json`): `@components/*`, `@services/*`, `@utils/*`, `@layouts/*`, `@data-contracts/*`, `@contexts/*`, `@interfaces/*` → `src/*`.

Backend (`tsconfig.json`): `@/*` → `src/*`, plus `@config`, `@controllers/*`, `@dtos/*`, `@exceptions/*`, `@interfaces/*`, `@middlewares/*`, `@models/*`, `@services/*`, `@utils/*`.

## Code Conventions

- **Prettier**: konfigurationen skiljer sig mellan paketen — `frontend/.prettierrc` har 120 print width, `trailingComma: es5` och `experimentalTernaries: true`, medan `backend/.prettierrc` har 150 print width, `trailingComma: all` och `arrowParens: avoid`. Båda har single quotes och 2-space indent. Formatera alltid mot filen i det paket du redigerar, inte mot den här sammanfattningen.
- **ESLint**: strict, type-aware flat config modeled on Sundsvalls Kommun's web-app-starter — `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked`, `simple-import-sort`, `unused-imports`, `no-console` (warn/error allowed), no `any`, och `noInlineConfig` (inline `eslint-disable`-kommentarer är förbjudna — åtgärda koden i stället). Kör `yarn lint:strict` och `yarn format:check` före push; båda körs i CI.
- **Component naming**: `*.component.tsx` pattern
- **Test selectors**: use `data-cy` attributes (Playwright is configured with `testIdAttribute: 'data-cy'`)
- **Language**: UI text and comments are in Swedish; code identifiers in English

## Testing

- **Vitest (frontend)**: unit/component tests in `frontend/tests/unit/`, config in `vitest.config.mts`, setup in `tests/setup.ts`
- **Vitest (backend)**: tests in `backend/src/tests/`, config in `vitest.config.mts` (SWC transform for decorator metadata); deterministisk testmiljö sätts i `src/tests/setup.ts`, ingen lokal test-envfil krävs
- **Playwright (frontend)**: specs i `e2e/tests/`, config i `playwright.config.ts`. Sviten kör mot `yarn dev` som Playwright startar själv (produktionsbygget använder standalone-output och kan inte startas med `next start`); CI verifierar `yarn build` som separat steg. `workers: 1` med flit — parallella workers gör on demand-kompileringen flaky.
- **E2E-harness**: importera `test`/`expect` från `e2e/utils/test.ts`, inte direkt från `@playwright/test` — fixturen sätter cookie-samtycke och mockar `/api/me`. Backend mockas med `page.route` mot JSON i `e2e/fixtures/`. Använd `appUrl(path)` i stället för att skicka en absolut sökväg till `goto()`, annars tappas `NEXT_PUBLIC_BASE_PATH`.
- **E2E-flaggor**: `playwright.config.ts` kastar om `NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE !== 'true'` eller `NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO === 'true'` i `frontend/.env` — registreringsscenarierna behöver dem.
- **CI**: `.github/workflows/ci.yml` kör strikt lint, formatkontroll, type-check, enhetstester (frontend + backend) och Playwright e2e.

## Docs

- `docs/json-schema-localization.md` — kontraktet för flerspråkiga JSON Schema-formulär (ägarskap och invariants; läs innan schemaspråk ändras).
- `docs/wcag-conformance-review.md` — kanonisk förvaltningsrapport för WCAG 2.2 AA-arbetet.

## Dependency Maintenance

Security alerts are handled locally with AI support via the `/deps-review` slash command (defined in `.claude/commands/deps-review.md`) — root-cause dependency upgrades over `resolutions`. Dependabot version-update PRs are intentionally not used.

## Environment

- Node 22.18.0 (använd den pinnade versionen i `.nvmrc`; `package.json` anger det stödda intervallet), Yarn
- Frontend env: copy `.env-example` → `.env`
- Backend env: copy `.env.example.local` → `.env.development.local`. `CLIENT_KEY`/`CLIENT_SECRET` krävs för att API:erna ska svara (WSO2-applikation som prenumererar på tjänsterna i `api-config.ts`); `SAML_*` behöver pekas mot en IDP.
- `docker-compose.yml` kör prod-byggen av båda. `ENVIRONMENT=LOCAL` stänger av Secure-flaggan på sessionskakan så att lokala prod-byggen fungerar över http; lämnas tom i TEST/produktion.
