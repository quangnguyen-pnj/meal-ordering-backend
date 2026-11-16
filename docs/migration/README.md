# Extraction from the monorepo (2026-11-16)

This repository (**meal-ordering-backend**, the Java API) and **meal-ordering-frontend** (the web) were extracted from the monorepo `quangnguyen-pnj/meal-ordering-platform` at commit `2fcd523` (`main`, 2026-11-16). The monorepo is left unchanged and stays the rollback source.

## History

Extracted with `git-filter-repo` 2.47.0 from a full (non-shallow) mirror of the monorepo, in two passes.

**Pass 1 – without the NestJS API.** Until J0 (`3863e29`, 2026-10-28) `apps/api/` held the NestJS API; J0 renamed it to `apps/api-legacy/` and started the Java API in `apps/api/`; J3 deleted the NestJS API. By decision, its history is not carried over: in every commit that is not J0 or a descendant of J0, the changes under `apps/api/` and to the NestJS image files (`docker/api.Dockerfile`, `docker/api-entrypoint.sh`) are removed, and so are J0's deletions of those paths. `apps/api-legacy/` is left out in pass 2. Every commit removed this way predates J0 (the last is from 2026-10-27).

**Pass 2 – paths:**

```bash
git filter-repo \
  --path apps/api/ --path scripts/ --path docs/ --path AGENTS.md --path README.md --path .env.example \
  --path .gitignore --path .gitattributes --path .editorconfig --path .dockerignore \
  --path docker/api.Dockerfile --path docker/docker-compose.yml \
  --path-rename apps/api/: --path-rename docker/api.Dockerfile:Dockerfile \
  --path-rename docker/docker-compose.yml:docker-compose.yml
```

| Item | Result |
| --- | --- |
| `main` | 85 of the monorepo's 180 commits (30 merges kept). The Java code's history starts at J0 (`9734a36` here); the 43 commits that are not J0 or its descendants carry only `docs/`, `README.md`, `AGENTS.md` and shared configuration (`.env.example`, `docker-compose.yml`, `.gitignore`, …). Commits that touched only the web were dropped |
| Branches | `main`, and `archive/brave-lamport-jmgsl7` (the unmerged workflow guide with screenshots, `docs/workflow-guide*`); no other branch was migrated |
| Tags | The monorepo has none |
| Authors, committers, dates | Unchanged for every commit (checked commit by commit) |
| Messages | Unchanged |
| Trees | At both branch tips, every file equals the monorepo's file at the mapped path (checked blob by blob) |

[`commit-map.txt`](commit-map.txt) maps every monorepo commit kept here to its new commit.

Limitations:

- Every commit hash is new. `Merge pull request #N` messages refer to pull requests of **meal-ordering-platform**.
- Signatures (GitHub web-flow merge signatures in the monorepo) are dropped by any history rewrite.
- The NestJS API (P0–P2, until J3) is not in this history; it remains in the monorepo.
- The monorepo's root `package.json`, `pnpm-workspace.yaml`, `turbo.json` and `pnpm-lock.yaml` are not in this history. Old commits therefore do not build on their own; the history is for reading, blame and `log --follow`.

## Changes made by the extraction

Everything below is in the single commit `chore: extract the API from the monorepo` on top of the history. Nothing in `meal-rules`, `meal-api`, `pom.xml`, `.mvn`, `mvnw*` or `openapi.json` changed; Java comments that mention `apps/web` or `packages/shared` were left as they are.

| File | Change |
| --- | --- |
| `package.json` | `packageManager`, `engines`; `db:local` script; `embedded-postgres` (same version, from the monorepo root) for `scripts/local-postgres.mjs` and `scripts/demo-p4-data.mjs`; its `onlyBuiltDependencies` |
| `pnpm-lock.yaml` | New: the monorepo lockfile reduced to `embedded-postgres` and its dependencies, same versions |
| `turbo.json` | Removed (turbo is not used) |
| `scripts/mvn.mjs` | `MEAL_ENV_FILE` is this repository's `.env` (was the monorepo root's) |
| `Dockerfile` (was `docker/api.Dockerfile`) | `COPY` paths of this repository |
| `docker-compose.yml` (was `docker/docker-compose.yml`) | PostgreSQL + API only; the API is published on `${API_PORT:-3001}` for the web. The project name `meal` and the `pgdata` volume are unchanged |
| `.env.example` | API variables only (the web's moved to meal-ordering-frontend; `WEB_PORT` was not carried over: nothing reads it) |
| `.gitignore` | Web entries removed |
| `AGENTS.md`, `README.md` | Scoped to the API; this repository holds the canonical copy of `docs/` |

## The API contract

`openapi.json` is the source of truth for the web's API types (`OpenApiTest` fails when it differs from what the API serves; `pnpm openapi` rewrites it). meal-ordering-frontend keeps a copy in `openapi/openapi.json` and generates its types from it; after an API change, copy the file there and run `pnpm api:types`.

## Rollback

The monorepo `quangnguyen-pnj/meal-ordering-platform` is unchanged (`main` at `2fcd523`, all branches). To go back, keep working there and archive the two new repositories.
