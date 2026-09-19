# Health Companion

Health Companion is an MVP for patient registration, practitioner booking, medical-result storage, and a general health-information chatbot. It uses a Spring Boot API, React/Vite web app, PostgreSQL, MinIO object storage, Liquibase, and either local Ollama or OpenAI for chat.

## Local setup

```bash
cp .env.example .env
docker compose up -d --wait
cd backend && set -a && source ../.env && set +a
```

Run the API from `backend/` with `SPRING_PROFILES_ACTIVE=demo,local-ai` for Ollama or `SPRING_PROFILES_ACTIVE=demo,openai` after setting `OPENAI_API_KEY`. Run the client from `web-app/`:

```bash
cd web-app && npm ci && npm run dev
```

## Chat configuration

The assistant is a general, authenticated health-information chatbot. It does not search, read, or cite patient documents, appointments, medical records, or a knowledge base. It keeps recent messages only for conversation continuity and applies medical-safety restrictions to questions and generated answers.

For local chat, install Ollama and pull the configured chat model:

```bash
ollama pull qwen3:4b
ollama run qwen3:4b "Reply exactly: ready"
```

`local-ai` selects Ollama chat at `http://localhost:11434`. `openai` selects OpenAI chat; set `OPENAI_API_KEY` and optionally `OPENAI_CHAT_MODEL` in `.env`.

PostgreSQL still uses the pgvector image only because historical Liquibase migrations require the extension during a fresh bootstrap. The final schema removes the extension and stores no vectors.

## Main capabilities

- Patient accounts, practitioner availability, and appointment booking
- Administrative medical-document upload, metadata management, preview, and download
- General health-information chat with stored, patient-owned conversation history
- Role checks, ownership checks, and medical-safety boundaries
