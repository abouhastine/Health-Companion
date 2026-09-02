# Health Companion

Health Companion is a (for now) MVP for patient registration, practitioner booking, medical-result storage, and source-grounded AI explanations. It runs a Spring Boot API, React/Vite web app, PostgreSQL with pgvector, MinIO object storage, Liquibase, and either local Ollama or OpenAI.

## Prerequisites

Install these once on the demo machine:

- Java 21 (the Maven wrapper downloads Maven automatically)
- Node.js 20.19+ and npm
- Docker Desktop (or another Docker engine with Compose)
- Ollama only for the local-AI option; install its desktop app/CLI and keep it outside Docker
- An OpenAI API key with API access only for the OpenAI option

Use a text-based PDF for the live upload. The MVP extracts embedded text with PDFBox; it does not perform OCR on scanned documents.

## One-Time Local Setup

From the repository root:

```bash
cp .env.example .env
cp web-app/.env.example web-app/.env
cd web-app && npm ci && cd ..
docker compose up -d --wait
docker compose ps
```

Docker starts PostgreSQL 16 with pgvector and MinIO. Compose reads `.env`; Spring Boot does not, so source it in every backend terminal before running the API:

```bash
cd backend
set -a; source ../.env; set +a
```

Start the backend with one of these profile combinations:

```bash
# Recommended local client demo (uses Ollama)
SPRING_PROFILES_ACTIVE=demo,local-ai ./mvnw spring-boot:run

# OpenAI-backed demo
SPRING_PROFILES_ACTIVE=demo,openai ./mvnw spring-boot:run
```

The default ports are API `8080`, web `5173`, PostgreSQL `5432`, MinIO API `9000`, and MinIO console `9001`. Confirm infrastructure at `http://localhost:8080/actuator/health` after the API starts.

## Select an AI Mode

Choose one option before starting the backend. Stop the running API before switching profiles.

### Recommended local demo setup

Run Ollama directly on your Mac, not in Docker. This lets Ollama use Apple Silicon acceleration and keeps the interactive RAG demo responsive. Docker Compose supplies only the stateful infrastructure:

```text
Your Mac
├── Ollama
│   ├── qwen3:4b
│   └── qwen3-embedding:0.6b
├── Spring Boot backend
└── React/Vite frontend

Docker Compose
├── PostgreSQL + pgvector
└── MinIO
```

With the `local-ai` profile, the backend calls Ollama at `http://localhost:11434`. Dockerizing Ollama is possible, but it is not the recommended MVP/client-demo workflow.

### Local Ollama (recommended client-demo mode)

#### Install Ollama on macOS

Ollama requires macOS Sonoma 14 or later. Download the macOS app from the official [Ollama download page](https://ollama.com/download), open the DMG, move **Ollama.app** to **Applications**, and launch it once. Approve its request to create the `ollama` CLI link when prompted. In a new terminal, confirm the installation:

```bash
ollama --version
```

Download models ahead of time; never pull them while presenting:

```bash
ollama pull qwen3:4b
ollama pull qwen3-embedding:0.6b
ollama list
ollama run qwen3:4b "Reply exactly: ready"
```

The macOS app normally runs the local service automatically. If it is not running, start it with `ollama serve`, then launch the API:

```bash
cd backend
set -a; source ../.env; set +a
SPRING_PROFILES_ACTIVE=demo,local-ai ./mvnw spring-boot:run
```

`local-ai` selects Ollama for both chat and embeddings. The document-chat endpoint streams tokens over SSE and the configured keep-alive keeps the chat model warm.

### OpenAI (reference/fallback mode)

#### Create an OpenAI API key

1. Sign in to the [OpenAI API Platform](https://platform.openai.com/), not the application frontend.
2. Open the [API Keys page](https://platform.openai.com/api-keys), select **Create new secret key**, and copy it immediately—the full key is displayed only once. Configure API billing/credits or project limits in the Platform if prompted.
3. Put the key in the root `.env` file. Do not put it in `web-app/.env`, commit it, or share it:

   ```dotenv
   OPENAI_API_KEY=your_secret_key_here
   ```

4. In a terminal that has sourced `.env`, verify that the key can authenticate:

   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

Optionally set `OPENAI_CHAT_MODEL` and `OPENAI_EMBEDDING_MODEL` in `.env`. Then run:

```bash
cd backend
set -a; source ../.env; set +a
SPRING_PROFILES_ACTIVE=demo,openai ./mvnw spring-boot:run
```

`openai` selects OpenAI for both chat and embeddings. The provider adapters, routes, and frontend do not change.

### Switching AI providers cleanly

Do not query embeddings created by one provider/model with another. When switching between `local-ai` and `openai`, stop the backend and start it with the new profile. Then choose one of these paths:

- **Keep existing local data:** sign in as an admin and re-index every uploaded document using `POST /api/admin/documents/{id}/reindex` (available in Swagger UI). This preserves users, appointments, PDF files, and documents while replacing their vector chunks with embeddings from the active provider.
- **Start a fresh local demo:** run `docker compose down -v`, then `docker compose up -d --wait`, and start the backend with the new `demo,<provider>` profiles. This deletes the local PostgreSQL and MinIO volumes; the `demo` profile recreates its seed data under the new provider.

## AI and RAG Reference

### Actual document-chat flow

1. An admin uploads a valid text-based PDF for a patient. The backend stores the original PDF in the MinIO `health-documents` bucket and stores its metadata plus object name in PostgreSQL.
2. The ingestion service loads the PDF from MinIO, uses PDFBox to extract text page by page, and splits the text into overlapping chunks (3,000 characters maximum, with a new chunk every 2,400 characters).
3. The active embedding provider—Ollama or OpenAI—turns each chunk into a numeric vector. PostgreSQL stores the chunk text, page, provider profile, and dimension; pgvector stores the vector. A successfully indexed document becomes `AVAILABLE`.
4. A signed-in patient opens **Ask about this result**. The web app calls `POST /api/ai/documents/{documentId}/chat/stream` with its JWT and the question.
5. The backend resolves or creates a patient-owned conversation, checks the selected document belongs to that patient, applies the basic medical-safety question filter, and loads up to eight earlier messages for continuity.
6. The query router chooses `DOCUMENT_CONTEXT` because a document is selected. Before vector retrieval, the backend verifies the document belongs to the authenticated patient; the model never chooses which patient data it may access.
7. The active embedding provider embeds the question. pgvector searches only chunks from the selected document whose embedding profile and dimensions match the active provider, returning up to `app.ai.top-k` nearest chunks (default: 4).
8. The backend sends the retrieved text, previous-message context, safety instruction, and question through `LlmGateway` to Ollama or OpenAI. The document prompt requires plain-language explanation from retrieved facts only, with no diagnosis, prescription, treatment advice, or medication changes.
9. The backend streams document-chat tokens to React over SSE, persists the user and assistant messages, records an AI audit event, and completes with structured source metadata (document title/page) plus the fixed limitation explaining what the AI cannot determine.

The generic assistant endpoint also routes appointment/result questions to normal PostgreSQL queries (`HEALTH_RECORD`), terminology questions to curated knowledge RAG (`MEDICAL_KNOWLEDGE`), and only then to a clearly labelled general-knowledge fallback (`GENERAL`).

### Post-MVP RAG improvements

- Add a re-index path for curated medical knowledge, not only uploaded patient documents. A provider switch currently permits individual document re-indexing, but existing knowledge chunks retain their old embedding profile; a reset is required to rebuild them.
- Prevent unsafe streamed text from reaching the browser before the answer safety check can block it. Non-streaming answers are fully checked first; streamed tokens cannot be retracted once sent.
- Apply a tested similarity threshold and return a `no relevant document context` outcome instead of always using the nearest chunks.
- Enforce a total prompt/token budget for retrieved chunks and conversation history, especially for the 4,096-token local Ollama context window.
- When no sufficiently relevant document content is found, explicitly offer a general-education fallback. It must state that the answer is not based on the patient record and must not show document sources.
- Strengthen deterministic safety and routing rules over time, including broader language coverage and more robust handling of indirect diagnostic, treatment, and medication requests.
- Before using OpenAI with real health data, define the required consent, redaction, provider-disclosure, and legal/privacy controls. Retrieved document text and recent conversation history are sent to the configured external provider.

### OCR versus RAG

OCR and RAG solve consecutive, different problems:

```text
Scanned or image-only PDF
  → OCR extracts machine-readable text
  → RAG chunks and embeds that text
  → pgvector retrieves relevant chunks
  → LLM explains the retrieved content
```

RAG is the retrieval and grounding layer; it cannot retrieve meaningful text from a scanned PDF when the file has no text layer. The MVP uses PDFBox and intentionally supports text-based PDFs only. If PDFBox extracts no chunks, indexing fails. OCR is therefore a post-MVP ingestion capability that makes scanned documents available to the existing RAG flow, rather than an alternative to RAG.

## Start the Web App

In a second terminal:

```bash
cd web-app
npm run dev
```

Open `http://localhost:5173`. Swagger UI is `http://localhost:8080/swagger-ui.html`; MinIO’s console is `http://localhost:9001`. The `demo` profile creates `admin@health-companion.demo` / `DemoPassword1!`; use it only locally.

### Quick Swagger API test

Swagger is public, but most API endpoints require a JWT. Obtain a current token with `POST /api/auth/login` in Swagger using the demo admin credentials:

```json
{
  "email": "admin@health-companion.demo",
  "password": "DemoPassword1!"
}
```

Copy the `token` from the response, click **Authorize** at the top of Swagger UI, and paste the token only—Swagger adds the `Bearer ` prefix. Then test a protected admin endpoint such as `GET /api/admin/practitioners`.

The token role controls which endpoints can be called:

- The demo-admin token can call `/api/admin/**`.
- A patient token obtained through registration or login can call `/api/appointments/**`, `/api/documents/**`, and `/api/ai/**`.

If Swagger returns `403`, log in again to obtain a fresh token and confirm it was entered through **Authorize**. The backend verifies the current JWT secret and the current database role for that user.

## Client Demo Checklist

Before the meeting, start Docker, the chosen AI mode, and the web app. With Ollama, send one hidden document question after uploading a PDF to warm up the model. Then demonstrate:

1. Register a patient and sign in.
2. Open a cardiologist, choose a future slot, book it, and show **My appointments**.
3. Sign out; sign in as the demo admin; upload a text-based blood-test PDF for that patient.
4. Sign back in as the patient; open the available result, preview it, and choose **Ask about this result**.
5. Ask: “Explain this result in simple terms,” then “Which values are outside the reference range?” and “What does ferritin mean?” Confirm the returned source/page and safety limitation.

## Reset, Stop, and Verify

```bash
# Stop services but preserve demo data
docker compose down

# Fresh demo database and MinIO objects — deletes local demo data
docker compose down -v
docker compose up -d --wait

# Quality gates
cd backend && ./mvnw test && ./mvnw verify -Pintegration
cd ../web-app && npm run format:check && npm run lint && npm test && npm run build
```

Liquibase owns the schema; add only forward migrations. Never commit `.env`, real JWT secrets, or OpenAI keys. See [Repository Guidelines](AGENTS.md) for contributor conventions and [the MVP specification](docs/health-companion-demo-mvp-spec.md) for the intended workflow.
