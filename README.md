# Health Companion

Health Companion is a demo MVP for patient registration, practitioner booking, medical-result storage, and source-grounded AI explanations. It runs a Spring Boot API, React/Vite web app, PostgreSQL with pgvector, MinIO object storage, Liquibase, and either local Ollama or OpenAI.

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

`openai` selects OpenAI for both chat and embeddings. The provider adapters, routes, and frontend do not change. A profile/model change requires re-indexing uploaded documents using `POST /api/admin/documents/{id}/reindex`; for a clean demo reset, use the optional reset command below and start the `demo` profile again to rebuild seeded knowledge.

## Start the Web App

In a second terminal:

```bash
cd web-app
npm run dev
```

Open `http://localhost:5173`. Swagger UI is `http://localhost:8080/swagger-ui.html`; MinIO’s console is `http://localhost:9001`. The `demo` profile creates `admin@health-companion.demo` / `DemoPassword1!`; use it only locally.

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
