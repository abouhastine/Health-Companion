# Health Companion

Demo MVP for appointment booking, patient documents, and source-aware AI explanations. The
repository contains a Java 21/Spring Boot API, a React/TypeScript web app, PostgreSQL with
pgvector, MinIO object storage, and forward-only Liquibase migrations.

## Prerequisites

- Java 21
- Node.js 20.19 or newer
- Docker with Compose

## Run locally

1. Copy the local configuration: `cp .env.example .env` and
   `cp web-app/.env.example web-app/.env`.
2. Start PostgreSQL/pgvector and MinIO: `docker compose up -d --wait`.
3. Start the API with demo fixtures:
   `cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=demo`.
4. In another terminal, start the web app: `cd web-app && npm ci && npm run dev`.

The API listens on `http://localhost:8080`; the Vite app listens on
`http://localhost:5173`. Swagger UI is at `http://localhost:8080/swagger-ui.html`, API JSON at
`http://localhost:8080/v3/api-docs`, health at `http://localhost:8080/actuator/health`, and the
MinIO console at `http://localhost:9001`.

The `demo` profile is intentionally explicit because it creates a demonstration administrator.
Credentials are `admin@health-companion.demo` / `DemoPassword1!`; never enable this profile in a
shared or production environment.

## AI setup prerequisite

The default profile does not require an AI service. It uses deterministic local embeddings and an
unavailable-chat fallback so database and UI work can proceed independently. To use Ollama, start
the configured models and add the `local-ai` profile:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo,local-ai
```

The intended local models are `qwen3:4b` and `qwen3-embedding:0.6b`. To use OpenAI, configure the
variables in `.env.example` and enable the `openai` profile.

`AiQueryRouter` always chooses one of these modes before calling an LLM:

- `DOCUMENT_CONTEXT` — selected, authorized patient document;
- `HEALTH_RECORD` — deterministic appointments/documents domain query;
- `MEDICAL_KNOWLEDGE` — curated knowledge-base retrieval;
- `GENERAL` — controlled fallback with a general-information notice.

Changing the chat provider does not require re-indexing. Changing the embedding provider does:
never mix embeddings from two models in a single vector index.

The patient UI includes a home overview, future-only practitioner availability, grouped upcoming,
past, and cancelled appointments, and persisted document processing status. Document ingestion can
be retried with `POST /api/admin/documents/{id}/reindex` when an upload is marked `FAILED`.

## Verification

- Backend unit tests: `cd backend && ./mvnw test`
- PostgreSQL/pgvector/Liquibase/MinIO and complete demo-flow integration:
  `cd backend && ./mvnw verify -Pintegration`
- Frontend quality gate: `cd web-app && npm run format:check && npm run lint && npm test && npm run build`
- Compose validation: `docker compose config`

The integration profile requires a Docker-compatible runtime. Liquibase owns all schema changes;
keep Hibernate at `ddl-auto=validate` and add new forward-only changelogs to the master file.

See [the bootstrap audit](docs/bootstrap-audit.md) for the comparison with Rider Companion and the
adaptation decisions.
