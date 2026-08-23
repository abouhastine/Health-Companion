# Health Companion

Demo MVP for appointment booking, patient documents, and source-aware AI explanations.

## Run locally

1. Start PostgreSQL/pgvector and MinIO: `docker compose up -d`.
2. Run the API: `cd backend && mvn spring-boot:run`.
3. Run the web app: `cd web-app && npm install && npm run dev`.

The API listens on port `8080` and the Vite app on port `5173`.

## AI setup prerequisite

The non-AI flows and deterministic `AiQueryRouter` can be built/tested independently. Before real AI/RAG integration tests, configure your selected Ollama or OpenAI gateway and embeddings. The default intended local models are `qwen3:4b` and `qwen3-embedding:0.6b`.

`AiQueryRouter` always chooses one of these modes before calling an LLM:

- `DOCUMENT_CONTEXT` — selected, authorized patient document;
- `HEALTH_RECORD` — deterministic appointments/documents domain query;
- `MEDICAL_KNOWLEDGE` — curated knowledge-base retrieval;
- `GENERAL` — controlled fallback with a general-information notice.

Changing the chat provider does not require re-indexing. Changing the embedding provider does: never mix embeddings from two models in a single vector index.

## Verification

- `cd backend && mvn test`
- `cd web-app && npm run build`
