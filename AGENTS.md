# Repository Guidelines

## Project Structure & Module Organization

- `backend/` contains the Spring Boot API. Production code is under
  `src/main/java/com/healthcompanion`, grouped by `api`, `ai`, `domain`, `repository`,
  `security`, and `config`.
- `backend/src/main/resources/db/changelog/` holds forward-only Liquibase migrations. Add new
  migrations using the next numeric prefix (for example, `006-description.yaml`) and include them
  in `db.changelog-master.yaml`.
- `backend/src/test/java/` contains JUnit unit and Testcontainers integration tests.
- `web-app/src/` is the Vite/React client: route composition lives in `routes/`, pages in
  `features/`, reusable UI in `components/`, and HTTP/session code in `services/`.
- `docs/` contains the product specification and implementation-status documentation.

## Build, Test, and Development Commands

Follow [`README.md`](README.md) for the full client-demo setup, AI switching, reindexing, warm-up, reset, and credentials. The short contributor flow is:

```bash
cp .env.example .env
docker compose up -d --wait
cd backend && set -a && source ../.env && set +a
```

Start the API from `backend/` with `SPRING_PROFILES_ACTIVE=demo,local-ai` for Ollama or `SPRING_PROFILES_ACTIVE=demo,openai` after setting `OPENAI_API_KEY`. Run the client from `web-app/`:

```bash
cd web-app && npm ci && npm run dev
```

Use these quality checks before review:

```bash
cd backend
./mvnw test
./mvnw verify -Pintegration
cd ../web-app
npm run lint && npm test && npm run build
```

The integration profile uses Testcontainers for PostgreSQL/pgvector and MinIO.

## Coding Style & Naming Conventions

Use Java 21: PascalCase classes, camelCase members, constructor injection, and DTO records at API boundaries. Keep controllers thin and business logic in services. Do not edit an applied Liquibase changeset.

Use strict TypeScript, PascalCase React components, camelCase functions, and feature-local pages such as `features/documents/DocumentPages.tsx`. Prettier and ESLint define formatting.

## Testing Guidelines

Name Java unit tests `*Test` and Docker-backed tests `*IT`. Add tests for authorization, lifecycle,
and API changes; use the real pgvector/MinIO path when changing RAG, storage, or migrations. Add
Vitest coverage for user-visible React behavior and schemas.

## Commit & Pull Request Guidelines

History uses short, descriptive commit subjects (for example, `format code` and `2nd iteration`).
Use an imperative summary that states the change. Keep commits focused. Pull requests should explain
the user impact, list validation commands run, link the relevant issue/spec section, and include UI
screenshots for visible frontend changes.

## Security & Configuration

Never commit real JWT secrets, OpenAI keys, or production database credentials. Docker Compose reads `.env`, but Spring Boot requires the variables to be exported/sourced. Preserve patient ownership checks and role restrictions when adding endpoints.
