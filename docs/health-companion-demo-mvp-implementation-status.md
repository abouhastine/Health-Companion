# Health Companion Demo MVP — Implementation Status

**Assessment date:** 2026-08-30  
**Specification:** `docs/health-companion-demo-mvp-spec.md`, section 16, Steps 1–7

## Outcome

All functional items listed in implementation Steps 1–7 are implemented across the Spring Boot
API, React web application, PostgreSQL/Liquibase schema, MinIO document storage, and AI/RAG module.

The audit initially found incomplete lifecycle, validation, document-state, AI-safety,
provider-streaming, source-metadata, UI-state, and integration-proof behavior. Those gaps were
fixed. A Docker-backed integration test now proves the primary demo story with real PostgreSQL,
pgvector, Liquibase, MinIO, PDF parsing, embeddings, retrieval, and authorization.

Live quality verification against actual Ollama and OpenAI accounts remains environment-dependent:
the adapters are implemented and configuration-driven, but models/API credentials are not bundled
with the repository. This is an external acceptance activity rather than missing application code.

## Step 1 — Technical Bootstrap

| Requirement | Status | Evidence |
| --- | --- | --- |
| Spring Boot project | Complete | Java 21, Spring Boot 3.4, Maven wrapper, Web, Security, Validation, JPA, Actuator, OpenAPI |
| React project | Complete | React 18, strict TypeScript, Vite, MUI, Router, Query provider, Hook Form, Zod, Vitest |
| PostgreSQL | Complete | PostgreSQL 16/pgvector runtime and Testcontainers integration |
| Liquibase | Complete | Six forward-only changesets; Hibernate uses `ddl-auto=validate` |
| Docker Compose | Complete | pgvector PostgreSQL healthcheck and MinIO object-storage service |
| Authentication foundation | Complete | Stateless Security filter chain, BCrypt, signed/expiring JWT, database-backed roles |
| Base UI layout | Complete | Reusable MUI theme, application shell, error boundary, providers, role-aware navigation |

## Step 2 — Authentication

| Requirement | Status | Evidence |
| --- | --- | --- |
| Registration | Complete | All specified fields, frontend Zod validation, backend Bean Validation, unique email, password confirmation |
| Login | Complete | BCrypt credential verification and typed JWT response |
| JWT | Complete | Signed token, expiry, bearer filter, user reloaded from PostgreSQL on each request |
| Patient/Admin roles | Complete | Database role constraints, backend RBAC, frontend patient/admin guards and role-aware redirects |
| Profile/sign-out | Complete | Ownership-scoped profile endpoint/page and versioned session cleanup |

## Step 3 — Practitioners

| Requirement | Status | Evidence |
| --- | --- | --- |
| Practitioner CRUD | Complete | Validated admin create/update/delete API and back-office UI with conflict responses |
| List/details | Complete | Patient list and detail pages show all specified metadata |
| Available slots | Complete | Public availability excludes past slots and computes the next future slot |
| Seed data | Complete | Demo profile seeds a general practitioner and cardiologist with address, languages, and future slots |

## Step 4 — Appointments

| Requirement | Status | Evidence |
| --- | --- | --- |
| Appointment slots | Complete | Admin create/update/toggle/delete API and UI; database time-order constraint |
| Booking | Complete | Validated future slot, pessimistic row lock, unique slot constraint, optional reason, immediate confirmation |
| My Appointments | Complete | Ownership-scoped DTO API and UI sections for upcoming, past, and cancelled appointments |
| Cancellation | Complete | Only the owning patient can cancel a future confirmed appointment; the slot is released |
| Lifecycle | Complete | Past confirmed appointments are transitioned to `COMPLETED` before patient/admin lists |

## Step 5 — Documents

| Requirement | Status | Evidence |
| --- | --- | --- |
| Upload | Complete | Admin selects patient/type/date/title/practitioner and uploads a validated non-empty PDF |
| Metadata | Complete | Typed response DTO hides `storagePath`; persisted `PROCESSING/AVAILABLE/FAILED` status |
| Patient list/details | Complete | Ownership-scoped pages show metadata, practitioner context, and ingestion status |
| Download/view | Complete | Authorized PDF preview/download; unavailable documents cannot be downloaded or queried |
| Storage and recovery | Complete | MinIO object storage, PDF signature validation, failed-ingestion state, admin re-index endpoint |

## Step 6 — AI / RAG

| Requirement | Status | Evidence |
| --- | --- | --- |
| PDF parsing | Complete | Page-aware Apache PDFBox extraction |
| Chunking | Complete | Overlapping page chunks with unique document/chunk index |
| Embeddings | Complete | Provider-neutral gateway; Ollama, OpenAI, and deterministic local-test implementations |
| pgvector | Complete | Dimension-agnostic vectors, profile/dimension isolation, scoped cosine retrieval |
| LLM gateway | Complete | Provider-neutral chat/stream interface with Ollama and OpenAI adapters |
| RAG retrieval | Complete | Authorization before document retrieval; separate patient-document and approved-knowledge scopes |
| Ask About This Result | Complete | Non-streaming REST and SSE endpoints plus progressive React conversation UI |
| Multi-turn conversation | Complete | Owned conversation/document scope, persistent messages, bounded prompt history |
| Query routing | Complete | Explicit document, health-record, medical-knowledge, and controlled-general modes |
| Structured health-record chat | Complete | Next/list/week appointments, latest result, and processing-result queries use deterministic domain data |
| Source references | Complete | Document title/page/scope and actual curated knowledge source/topic are returned and rendered |
| Safety boundaries | Complete | Input policy, restrictive prompts, generated-output guard, safety audit flag, UI warning and limitation text |
| Provider controls | Complete | Configurable top-K, timeout, temperature, Ollama context/keep-alive, HTTP status checks, true OpenAI SSE parsing |

### Provider architecture decision

The specification recommends Spring AI, but the implementation retains small raw-HTTP adapters
behind `LlmGateway` and `EmbeddingGateway`. This is a deliberate library-level deviation, not a
feature gap: provider code remains isolated, chat and embedding providers are independently
configurable, and routing/retrieval/business logic is provider-independent.

## Step 7 — Back Office

| Requirement | Status | Evidence |
| --- | --- | --- |
| Practitioner management | Complete | Validated CRUD form/API |
| Slot management | Complete | Practitioner selection, create, availability update, and delete |
| Patient list | Complete | Admin-only patient list |
| Appointment list | Complete | Admin-only list with completed lifecycle applied |
| Document upload | Complete | Patient-associated PDF upload with optional practitioner and processing feedback |

## Gaps found and fixed

1. Past slots appeared as available → repository/API now require `startAt > now`.
2. Past appointments remained confirmed and the UI was ungrouped → lifecycle transition and
   upcoming/past/cancelled sections added.
3. Cancellation returned an empty HTTP 200 that the fetch client tried to parse as JSON → it now
   returns 204.
4. Appointment entity serialization failed on a Hibernate proxy during a real booking → explicit
   appointment DTOs and eager detail queries added.
5. Document status was a transient constant → status is persisted with a forward Liquibase change,
   processing/failure handling, and re-index support.
6. PDF validation trusted only the declared MIME type → empty files and invalid PDF signatures are
   rejected.
7. Persistence internals such as MinIO object names were exposed → document DTOs now define the API
   boundary.
8. Validation was inconsistent → auth, booking, chat, practitioner, slot, knowledge, and upload
   inputs now have server constraints.
9. Admin users could enter patient-only APIs and patient routing → backend RBAC and frontend
   patient/admin guards are now aligned.
10. The required patient home page was absent → a parallel-loading patient overview was added.
11. Medical-knowledge citations used a generic label → real source/topic metadata is returned.
12. Retrieval ignored configurable top-K → both RAG scopes now use `app.ai.top-k`.
13. Generated model output had no policy check → unsafe output is replaced, audited, and visibly
    flagged.
14. OpenAI document streaming emitted one complete answer → Chat Completions SSE deltas are parsed
    progressively.
15. Provider clients lacked timeouts/status validation and Ollama tuning → explicit connect/request
    timeouts, HTTP checks, empty-response checks, temperature, context, and keep-alive added.
16. No automated complete demo-story test existed → `DemoFlowIT` covers registration, RBAC,
    practitioner/slot management, booking, cross-patient denial, real MinIO PDF upload/download,
    PDFBox ingestion, pgvector retrieval, two-turn RAG, sources, conversation ownership, and
    cancellation.
17. The fixed `vector(768)` schema only exercised the deterministic test embedder and could reject
    configured Ollama/OpenAI dimensions → vectors are now dimension-agnostic, each chunk persists
    its embedding dimension, and retrieval requires both matching provider profile and dimension.

## Mobile beta — implemented source and backend contract

The separate patient mobile beta is specified in `docs/health-companion-mobile-beta-spec.md` and
implemented in `mobile-app/`. It is intentionally distinct from the completed web-demo scope.

| Area | Status | Evidence |
| --- | --- | --- |
| Mobile app shell | Complete | Expo Router tabs for Home, Find care, Appointments, Results, and Assistant, plus patient auth/profile/detail flows |
| Patient features | Complete | Registration/login, practitioner slots, booking/reschedule/cancel, results/PDF viewing, general and document-scoped assistant flows |
| Mobile sessions | Complete | Mobile-only auth endpoints; 15-minute access JWTs; rotating, hashed, revocable refresh tokens persisted in `mobile_sessions` |
| Secure re-entry | Complete | Expo SecureStore with biometric/device-passcode protection and in-memory access tokens |
| Beta configuration | Complete | HTTPS API environment template and EAS internal-distribution profiles for iOS and Android |
| Device/store acceptance | Pending external activity | Requires a configured HTTPS demo deployment, signed Apple/Google accounts, and physical/simulator device testing |

## Verification evidence

| Check | Result |
| --- | --- |
| Backend unit tests | Passed — 14 tests, including mobile session issue/rotation/expiry/revocation |
| PostgreSQL/Liquibase schema integration | Passed against `pgvector/pgvector:pg16` |
| Complete demo-flow integration | Passed against real pgvector PostgreSQL and MinIO |
| Integration tests | Passed — 5 integration tests, including mobile register/refresh/replay/logout flow |
| Frontend lint | Passed with zero warnings |
| Frontend tests | Passed — 3 tests |
| Frontend TypeScript/Vite production build | Passed |
| Mobile lint, unit test, and TypeScript checks | Passed — Expo workspace lint, Jest API test, and strict `tsc --noEmit` |
| Mobile device/TestFlight/Play validation | Not run: requires supplied app-store credentials, HTTPS demo hostname, and devices |
| Docker Compose validation | Passed |
| Live Spring Boot demo-profile startup | Passed against Compose PostgreSQL/MinIO |
| Live Vite startup | Passed |
| Browser visual/console inspection | Not run: no browser connection was available in this session |
| Live Ollama/OpenAI answer-quality benchmark | Requires local models or an API key; adapters compile and are configuration-complete |

## Scope note

Section 16 Step 8 and section 3.2 contain optional polish such as benchmark automation, dashboard
statistics, rescheduling, tagging, filters, email, and result comparison. They are intentionally
not classified as Steps 1–7 feature gaps.
