# PNJP Meal Ordering System – API

Replaces the Excel-and-paper lunch ordering at the PNJP Go Vap factory: employees register a week ahead, the system cancels meals for absent employees from DMP attendance, and the HC admin finalizes the count at 08:30 and exports a file for the caterer.

This repository is the **API**: Java 25 + Spring Boot 4 (Maven), PostgreSQL 17 with Flyway. The web (Next.js) is the separate repository **meal-ordering-frontend**. Both were extracted from the `meal-ordering-platform` monorepo with their Git history; see [docs/migration/README.md](docs/migration/README.md). This repository holds the canonical copy of `docs/`.

## Layout

| Path                                        | What                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `meal-rules`                                | Pure business rules (BR-xx), no Spring, no database                                 |
| `meal-api`                                  | Spring Boot app: controllers, services, jobs, DMP and Entra clients, seed          |
| `meal-api/src/main/resources/db/migration`  | Flyway migrations                                                                   |
| `openapi.json`                              | The API's OpenAPI description; the web's types are generated from it                |
| `scripts`                                   | `mvn.mjs` (Maven wrapper for the pnpm scripts), `local-postgres.mjs`, `demo-p4-data.mjs` |
| `Dockerfile`, `docker-compose.yml`          | API image; PostgreSQL + API for development                                         |
| `docs`                                      | `plan.md`, `decisions.md`, `open-questions.md`, `security.md`, demo guides          |

Working rules for contributors and agents are in [AGENTS.md](AGENTS.md).

## Quick start (no Docker)

Needs a JDK 25 (`JAVA_HOME`; Maven comes with `mvnw`), and Node >= 22.12 with pnpm 9 for the scripts. Keep the checkout path short on Windows (see `docs/decisions.md`).

```bash
pnpm install
cp .env.example .env
pnpm db:local        # terminal 1: PostgreSQL on :5433, keep it running
pnpm db:seed         # migrates (Flyway) and loads the demo data: 1 factory, 1,700 employees
pnpm dev             # terminal 2: Java API on :3001 (jobs on)
```

`pnpm db:local` runs as a normal user (PostgreSQL refuses to run as root). The scripts point the API at this repository's `.env` (`MEAL_ENV_FILE`); running `./mvnw -pl meal-api spring-boot:run` yourself needs `MEAL_ENV_FILE` or the variables in the environment.

Then start the web from meal-ordering-frontend (`pnpm dev` there, :3000) and sign in at http://localhost:3000 with `PNJP000001` and the PIN `123456`; you are asked to change it. More accounts and the demo scripts: [docs/demo-p0.md](docs/demo-p0.md) … [docs/demo-p4.md](docs/demo-p4.md).

## Quick start (Docker)

```bash
cp .env.example .env
docker compose --env-file .env up --build      # PostgreSQL + API, API on localhost:3001
```

Then start the web and nginx from meal-ordering-frontend (`docker compose up --build` there) and open http://localhost:8080. The stack is development-only (mock Microsoft sign-in, fake time, seeded data on start).

## How the web reaches this API

The browser calls the same-origin `/api` of the web's address; the web's dev server or nginx forwards it here. The API has no CORS configuration and the session cookie is `SameSite=Lax`, so the web and `/api` must share one origin. `APP_BASE_URL` and `ENTRA_REDIRECT_URI` use that origin (`http://localhost:8080` with the Docker stacks).

## Environment

Every variable, with development values, is in [.env.example](.env.example): database (`DATABASE_URL`, `POSTGRES_*`), sessions (`SESSION_SECRET`, `SESSION_TTL_HOURS`, `COOKIE_SECURE`), fake time (`CLOCK_FAKE_ENABLED`), jobs (`JOBS_ENABLED`), OpenAPI (`API_DOCS_ENABLED`), Entra ID (`ENTRA_*`), DMP (`DMP_*`) and the seed (`SEED_*`, `FIRST_SYSTEM_ADMIN_CODE`). Production needs real values for `SESSION_SECRET`, `ENTRA_*` and `DMP_*`, `NODE_ENV=production` and `COOKIE_SECURE=true`.

## Checks

```bash
./mvnw verify    # Spotless check, compile, unit and integration tests
```

Tests start a throwaway PostgreSQL (embedded) or use `TEST_DATABASE_URL`. The pnpm scripts `lint`, `typecheck`, `test` and `build` run the same Maven goals.

## API description

With `API_DOCS_ENABLED=true` (development) the API serves its OpenAPI description at `/api/openapi.json`. After changing a request or response, `pnpm openapi` rewrites `openapi.json` (a test fails while it is stale); then copy it to `openapi/openapi.json` in meal-ordering-frontend and run `pnpm api:types` there.

## Notes

- `docs/plan.md` is the MVP plan and the source of truth for every phase.
- `docs/security.md` is the security checklist every change goes through. Production must run on HTTPS (`COOKIE_SECURE=true`; the api refuses to start otherwise).
