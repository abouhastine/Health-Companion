# Health Companion — Demo MVP Specification

## 1. Purpose

This document defines a **short MVP specification** for a fast client demo of **Health Companion**.

The goal is not to implement the complete product vision.

The goal is to demonstrate a credible end-to-end healthcare workflow with:

- Patient registration and authentication
- Practitioner discovery
- Appointment booking
- Medical documents and results
- A minimal back office
- An AI Health Assistant using **LLM + RAG**
- A contextual **Ask About This Result** experience

The demo focuses only on a **Web App**.

Mobile applications, advanced healthcare integrations, telemedicine, and enterprise-grade workflows are outside the demo scope. A separate, planned patient mobile beta is defined in
`docs/health-companion-mobile-beta-spec.md`; it does not change this web-demo specification or its
completion criteria.

---

# 2. Demo Objective

The client should be able to understand the product value in a few minutes.

The main demo flow is:

```text
Patient Registration
        ↓
Sign In
        ↓
Browse Practitioners
        ↓
View Practitioner
        ↓
Choose Available Slot
        ↓
Book Appointment
        ↓
View My Appointments
        ↓
Open Medical Result
        ↓
Ask About This Result
        ↓
AI / RAG Conversation
```

A secondary admin flow demonstrates that practitioners, appointment slots, and medical documents can be managed from a simple back office.

---

# 3. Demo Scope

## 3.1 Required

### Authentication

- Patient Sign Up
- Sign In
- Sign Out
- Basic Patient Profile
- Basic role management

### Practitioners

- Practitioner List
- Practitioner Details
- Specialty
- Healthcare Organization
- Available appointment slots

### Appointments

- Book Appointment
- View My Appointments
- Cancel Appointment
- Appointment status

### Medical Documents & Results

- Medical Result List
- Medical Result Details
- Upload PDF document
- Associate a result/document with a patient
- View/download result

### AI Health Assistant

- General patient health-record chat
- `Ask About This Result`
- RAG over selected medical result/document
- Multi-turn conversation
- Result summary
- Medical terminology explanation
- Reference-range explanation based on the uploaded result
- Source references
- Safety boundaries
- No diagnosis
- No treatment recommendation

### Minimal Back Office

- Practitioner CRUD
- Appointment Slot CRUD
- Patient List
- Appointment List
- Medical Document Upload
- Associate result/document with patient

---

## 3.2 Optional

If implementation time allows:

- Specialty CRUD
- Organization CRUD
- Dashboard statistics
- Appointment rescheduling
- Document tagging
- AI conversation history
- Result comparison over time
- Admin filters and search
- Email notifications

---

## 3.3 Out of Scope

- Mobile App
- Telemedicine
- Real-time waiting room
- Complex recurring practitioner schedules
- Payment
- Pharmacy integration
- Laboratory integration
- Imaging system integration
- HL7 / FHIR
- Family profiles
- Push notifications
- SMS integration
- Full EHR
- Advanced consent management
- Advanced multi-tenant organization management
- Production-grade medical decision support

---

# 4. User Roles

## PATIENT

Can:

- Register
- Sign in
- View practitioners
- Book appointments
- View own appointments
- View own medical results/documents
- Use AI Assistant on authorized health data

## ADMIN

Can:

- Manage practitioners
- Manage available slots
- View patients
- View appointments
- Upload and associate medical results/documents

For the demo, a dedicated practitioner portal is optional.

---

# 5. Functional Requirements

# 5.1 Authentication

## Sign Up

Fields:

- First name
- Last name
- Email
- Phone number
- Password
- Confirm password

## Sign In

Fields:

- Email
- Password

## Basic Rules

- Email must be unique
- Password must be hashed
- Authenticated routes must be protected
- Patient can only access their own data
- Admin endpoints require `ADMIN` role

---

# 5.2 Practitioner Directory

## Practitioner List

Display:

- Full name
- Specialty
- Organization
- Location
- Next available slot

## Practitioner Details

Display:

- Full name
- Specialty
- Organization
- Address
- Languages
- Available appointment slots

For the demo, practitioner data may be seeded in the database.

---

# 5.3 Appointment Booking

## Booking Flow

1. Open practitioner details
2. Select available slot
3. Enter optional reason for visit
4. Confirm appointment

## Appointment Status

```text
CONFIRMED
CANCELLED
COMPLETED
```

For the demo, appointments can be confirmed immediately.

## My Appointments

Patient can view:

- Upcoming appointments
- Past appointments
- Cancelled appointments

## Cancellation

Patient can cancel a future appointment.

---

# 5.4 Medical Results & Documents

## Medical Result List

Display:

- Result title
- Document type
- Date
- Practitioner or organization
- Status

## Result Details

Display:

- Result metadata
- Attached PDF
- Download action
- `Ask About This Result` action

## Supported Document Types

```text
LAB_RESULT
IMAGING_RESULT
MEDICAL_REPORT
PRESCRIPTION
OTHER
```

## Upload

Admin can:

- Select patient
- Select document type
- Enter title
- Upload PDF
- Enter document date
- Optionally associate practitioner

---

# 6. AI Health Assistant

The AI Assistant is a core demo feature.

The assistant must be positioned as a **Health Information Assistant**, not as an AI doctor.

---

# 6.1 AI Use Cases

## General Health Record Chat

Examples:

> What is my next appointment?

> Show me my latest medical result.

> Which result was uploaded most recently?

The assistant may query structured application data.

## Ask About This Result

The patient opens a medical result and clicks:

> **Ask About This Result**

The selected result becomes the primary AI context.

Examples:

> Summarize this result in simple terms.

> What does ferritin mean?

> Which values are outside the reference range?

> Explain the conclusion section.

> What questions could I ask my doctor?

---

# 6.2 AI Safety Boundaries

The assistant may:

- Explain terminology
- Summarize documents
- Extract factual values
- Compare document values with the reference ranges shown in the document
- Retrieve patient-owned information
- Suggest questions to discuss with a healthcare professional

The assistant must not:

- Diagnose
- Prescribe
- Recommend medication changes
- Recommend treatment plans
- Claim that a condition is improving or worsening based only on isolated data
- Replace practitioner interpretation

Example safe response:

```text
Your report lists ferritin at 18 ng/mL and shows a reference range of
20–150 ng/mL. Based on the range printed on this report, the value is
below the listed reference interval.

This does not establish a diagnosis or determine the cause.
A healthcare professional can interpret it together with your symptoms,
medical history, and other results.
```

---

# 6.3 AI Response Structure

Where relevant, structure responses as:

### From Your Result

Facts extracted from the selected document.

### General Explanation

Educational explanation based on approved medical knowledge.

### What the AI Cannot Determine

Explicit statement of the limitation.

---

# 7. Proposed Demo Architecture

For the demo, prioritize **speed, simplicity, and maintainability**.

Use a **Modular Monolith**.

Do not use microservices for the demo.

```text
              React Web App
                    │
                    ▼
             Spring Boot API
                    │
       ┌────────────┼─────────────┐
       │            │             │
       ▼            ▼             ▼
   Core Business   Document      AI Module
     Modules        Module
       │            │             │
       └────────────┼──────┬──────┘
                    │      │
                    ▼      ▼
              PostgreSQL  LLM Provider
                    │
                    ▼
                 pgvector
                    │
                    ▼
               File Storage
```

Recommended backend modules:

```text
auth
patients
practitioners
appointments
documents
ai
admin
```

This structure is simple enough for a demo while preserving clear boundaries for future expansion.

---

# 8. Backend Technology Stack

Recommended stack:

- Java 21
- Spring Boot 3
- Maven
- Spring Web
- Spring Security
- JWT
- Spring Data JPA
- Hibernate
- PostgreSQL
- Liquibase
- pgvector
- Bean Validation
- MapStruct
- OpenAPI / Swagger
- JUnit 5
- Mockito
- Testcontainers

## Demo Simplifications

To go fast:

- Use one Spring Boot application
- Use one PostgreSQL database
- Use one authentication mechanism
- Use simple RBAC with `PATIENT` and `ADMIN`
- Seed demo practitioner data
- Keep appointment scheduling simple
- Use predefined available slots
- Avoid advanced workflow engines

---

# 9. Frontend Technology Stack

Recommended Web App stack:

- React
- TypeScript
- Vite
- Material UI
- React Router
- TanStack Query
- React Hook Form
- Zod
- Axios or Fetch API
- Vitest
- React Testing Library

## Frontend Structure

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── practitioners/
│   ├── appointments/
│   ├── documents/
│   ├── ai/
│   └── admin/
├── layouts/
├── routes/
├── services/
├── hooks/
├── types/
└── utils/
```

The UI should use a reusable Material UI theme.

For the demo, prioritize:

- Clean patient-facing flows
- Fast navigation
- Clear appointment booking
- Clear medical-result presentation
- Prominent `Ask About This Result` action
- Simple admin back office

---


# 10. AI Provider Strategy — Local Ollama + OpenAI

The demo must support **two interchangeable AI execution modes**:

1. **LOCAL mode** using Ollama on the developer machine.
2. **OPENAI mode** using the OpenAI API.

The application must allow switching between the two providers through configuration only.

No business code, controller code, RAG logic, or frontend code should need to change when switching providers.

The target configuration is:

```text
ai.provider=ollama
```

or:

```text
ai.provider=openai
```

The local provider is the preferred mode for the live client demo when performance is acceptable. OpenAI is the reference/fallback provider for quality comparison and rapid validation.

---

## 10.1 Local Demo Hardware Target

The local demo environment is expected to run on:

```text
MacBook Pro
Apple M3 Pro
18 GB unified memory
```

The local AI configuration must therefore prioritize:

- Low memory pressure
- Fast first-token latency
- Smooth multi-turn chat
- Good French language quality
- Reasonable multilingual capability
- Sufficient RAG grounding quality
- No heavy reasoning model
- No large context window unless required

The demo should avoid 20B+, 30B+, or 70B-class models on this machine.

---

## 10.2 Recommended Local Chat Model

### Default Local Model

Use:

```text
qwen3:4b
```

through Ollama as the default local chat model for the demo.

Reasons:

- Small enough to run comfortably on an 18 GB M3 Pro alongside Spring Boot, PostgreSQL, Docker, React, Codex/IDE, and the embedding model
- Fast enough for an interactive demo
- Good instruction-following capabilities
- Good French support
- Useful multilingual capabilities for future Arabic testing
- More appropriate for a RAG-based explanation assistant than a large reasoning-heavy model

The demo must prioritize **responsiveness and grounding** over maximum standalone model intelligence.

### Optional Quality Profile

A second local profile may be evaluated using:

```text
qwen3:8b
```

only if benchmark results show acceptable memory usage and latency on the target machine.

The 8B profile should not be the default demo configuration until locally benchmarked.

### Local Chat Runtime Configuration

Recommended starting configuration:

```yaml
app:
  ai:
    provider: ollama

spring:
  ai:
    ollama:
      base-url: http://localhost:11434
      chat:
        model: qwen3:4b
        keep-alive: 10m
        options:
          temperature: 0.2
          num-ctx: 4096
```

The exact Spring AI property names must match the Spring AI version selected in the Maven project.

A relatively low temperature is recommended because the assistant should provide controlled, source-grounded explanations rather than creative responses.

The context window should remain modest for the demo to reduce memory consumption and latency.

Spring AI provides a native `OllamaChatModel` integration and supports Ollama model configuration, including model selection, context size, and model keep-alive behavior. citeturn806293search0turn806293search2

---

## 10.3 Recommended Local Embedding Model

Use:

```text
qwen3-embedding:0.6b
```

as the preferred local embedding model.

The embedding model should be significantly smaller than the chat model so it can coexist comfortably with the rest of the demo stack.

The embedding workflow remains:

```text
Medical PDF
    ↓
PDFBox
    ↓
Chunks
    ↓
Local Embedding Model
    ↓
PostgreSQL + pgvector
```

For query-time retrieval:

```text
Patient Question
    ↓
Local Embedding Model
    ↓
pgvector Similarity Search
    ↓
Relevant Chunks
```

The embedding model should not be switched casually after documents have already been indexed.

Changing embedding models generally requires rebuilding the vector index because embeddings generated by different models do not share the same vector space.

---

## 10.4 Ollama Setup for the Demo

Required local models should be downloaded before the demo.

Example:

```bash
ollama pull qwen3:4b
ollama pull qwen3-embedding:0.6b
```

Do not configure the application to download large models automatically during startup for the client demo.

Spring AI supports automatic Ollama model pulling, but this can significantly delay application startup. Models should therefore be pre-downloaded for a predictable demo experience. citeturn806293search0

Ollama should run directly on macOS rather than inside the main Docker Compose stack for the developer demo.

Recommended:

```text
macOS
├── Ollama
│   ├── qwen3:4b
│   └── qwen3-embedding:0.6b
│
└── Docker Compose
    ├── PostgreSQL + pgvector
    ├── MinIO
    └── optional backend/web containers
```

This allows Ollama to use Apple Silicon acceleration directly while keeping infrastructure services containerized.

---

## 10.5 OpenAI Provider

The same application must also support OpenAI as an alternative provider.

OpenAI should be used for:

- Initial reference testing
- Quality comparison
- Fallback during development
- Benchmarking local model responses
- Demonstrating that the architecture is provider-independent

Conceptually:

```yaml
app:
  ai:
    provider: openai
```

with:

```text
OPENAI_API_KEY
```

provided as an environment variable.

The OpenAI model name must remain configurable rather than hard-coded.

Spring AI exposes a common `ChatModel` abstraction across providers, including OpenAI and Ollama, specifically to support consistent application integration and easier switching between implementations. citeturn806293search1turn806293search4

---

## 10.6 Provider Abstraction

The application must not inject `OllamaChatModel` or `OpenAiChatModel` directly into domain/application services.

Use an application-level abstraction such as:

```java
public interface LlmGateway {

    AiResponse generate(AiRequest request);

    Flux<AiResponseChunk> stream(AiRequest request);
}
```

Implementations:

```text
OllamaLlmGateway
OpenAiLlmGateway
```

Selection should be controlled through Spring configuration.

Example:

```text
@ConditionalOnProperty(
    name = "app.ai.provider",
    havingValue = "ollama"
)
```

and:

```text
@ConditionalOnProperty(
    name = "app.ai.provider",
    havingValue = "openai"
)
```

The same approach should be applied to embeddings:

```java
public interface EmbeddingGateway {

    float[] embed(String text);

}
```

Implementations:

```text
OllamaEmbeddingGateway
OpenAiEmbeddingGateway
```

---

## 10.7 Recommended Spring AI Integration

Spring AI should be used as the common AI integration framework.

Target design:

```text
HealthAssistantService
        │
        ├── LlmGateway
        │      ├── OllamaLlmGateway
        │      └── OpenAiLlmGateway
        │
        ├── EmbeddingGateway
        │      ├── OllamaEmbeddingGateway
        │      └── OpenAiEmbeddingGateway
        │
        └── VectorRetriever
               ↓
         PostgreSQL / pgvector
```

Spring AI's common chat model interfaces are intended to provide a consistent API across different AI providers. citeturn806293search1

Ollama also exposes an OpenAI-compatible endpoint, which provides an additional future integration option. For the demo, explicit provider adapters are preferred because they make provider behavior and configuration clearer. citeturn806293search0

---

## 10.8 Separate Chat and Embedding Provider Configuration

The architecture should support separate provider configuration for chat and embeddings.

Recommended configuration model:

```yaml
app:
  ai:
    chat-provider: ollama
    embedding-provider: ollama
```

This allows future combinations such as:

```text
Chat        → OpenAI
Embeddings  → Ollama
```

or:

```text
Chat        → Ollama
Embeddings  → Ollama
```

For the client demo, the preferred profile is:

```text
Chat        → Ollama / qwen3:4b
Embeddings  → Ollama / qwen3-embedding:0.6b
```

For reference testing:

```text
Chat        → OpenAI
Embeddings  → OpenAI
```

Do not mix embedding providers within the same pgvector index.

---

## 10.9 Configuration Profiles

Provide explicit Spring profiles or environment files.

Example:

```text
application.yml
application-local-ai.yml
application-openai.yml
```

### Local AI Profile

```yaml
app:
  ai:
    chat-provider: ollama
    embedding-provider: ollama
```

### OpenAI Profile

```yaml
app:
  ai:
    chat-provider: openai
    embedding-provider: openai
```

The application should therefore be switchable with something equivalent to:

```bash
SPRING_PROFILES_ACTIVE=local-ai
```

or:

```bash
SPRING_PROFILES_ACTIVE=openai
```

No source-code modification should be required.

---

## 10.10 Streaming Responses

The chat endpoint should support streaming responses.

Preferred frontend experience:

```text
Patient asks question
        ↓
Backend starts generation
        ↓
Tokens/chunks progressively reach React
        ↓
Answer appears progressively
```

This is especially important for local models because streaming significantly improves perceived latency during the demo.

Spring AI supports both `ChatModel` and `StreamingChatModel`, including Ollama streaming support. citeturn806293search0turn806293search1

The implementation may use:

- Server-Sent Events (SSE), or
- a streaming HTTP response

SSE is preferred for the demo because communication is primarily server-to-client after submitting a question.

Suggested endpoint:

```http
POST /api/ai/documents/{documentId}/chat/stream
```

---

## 10.11 Local Demo Performance Guidelines

To keep the local demo smooth on the M3 Pro / 18 GB machine:

- Use `qwen3:4b` as the default chat model
- Keep the model loaded using Ollama `keep-alive`
- Pre-download all models
- Avoid thinking/reasoning mode for normal result explanations
- Use a low temperature
- Keep `num-ctx` around 4K initially
- Retrieve only a small number of high-quality chunks
- Start with `topK = 4`
- Avoid injecting entire PDFs into the prompt
- Keep conversation history bounded
- Summarize or truncate old conversation turns if required
- Use streaming responses
- Do not run multiple large local chat models simultaneously
- Keep the embedding model small
- Avoid OCR during the live demo; use text-based PDFs
- Complete document ingestion before starting the interactive demo when possible

Recommended RAG parameters to benchmark:

```text
chunk size      ≈ 500–800 tokens
chunk overlap   ≈ 50–100 tokens
topK            = 4
temperature     ≈ 0.2
context window  ≈ 4K
```

These are starting values and must be benchmarked against the selected sample documents.

---

## 10.12 Model Warm-Up

Before presenting to the client:

1. Start Ollama
2. Start PostgreSQL / pgvector and MinIO
3. Start Spring Boot
4. Start React
5. Run one hidden warm-up prompt against `qwen3:4b`
6. Verify sample medical documents have already been embedded
7. Execute one RAG query
8. Keep the model loaded

This avoids demonstrating cold-start latency.

---

## 10.13 AI Benchmark Mode

The demo project should include a small repeatable benchmark dataset.

Example:

```text
sample-data/
├── blood-test.pdf
├── imaging-report.pdf
└── ai-evaluation/
    ├── questions.json
    └── expected-facts.json
```

Representative questions:

```text
What is my ferritin value?
What reference range is shown?
Explain ferritin in simple terms.
Which values are outside the laboratory reference ranges?
What is my vitamin D value?
What disease do I have?
```

The same questions should be tested against:

```text
LOCAL / Ollama
OPENAI
```

Compare:

- Factual correctness
- Grounding
- Hallucination rate
- French quality
- Arabic quality when required
- Time to first token
- Total response time
- Memory consumption
- RAG source accuracy
- Safety-boundary compliance

The objective is not to prove that the local model is universally better than OpenAI.

The objective is to prove that the application can support both modes and determine which mode satisfies product, privacy, performance, and cost requirements.

---

## 10.14 Demo AI Architecture

Final demo architecture:

```text
                           React Web App
                                │
                                │ REST / SSE
                                ▼
                         Spring Boot API
                                │
                                ▼
                      HealthAssistantService
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
         Authorization     VectorRetriever     LlmGateway
              │                 │                 │
              │                 ▼          ┌──────┴──────┐
              │          PostgreSQL         │             │
              │           + pgvector     Ollama        OpenAI
              │                              │             │
              │                         qwen3:4b      Configurable
              │
              ▼
        MedicalDocument
              │
              ▼
             MinIO

Document Ingestion:
MinIO PDF
   ↓
PDFBox
   ↓
Chunking
   ↓
EmbeddingGateway
   ↓
┌──────────────────┐
│                  │
Ollama           OpenAI
qwen3-embedding
   │                  │
   └────────┬─────────┘
            ▼
     PostgreSQL + pgvector
```

---

## 10.15 Demo Default and Fallback

### Default Client Demo

```text
Chat:
Ollama → qwen3:4b

Embeddings:
Ollama → qwen3-embedding:0.6b

Data:
Local

Per-request AI API cost:
€0
```

### Reference / Fallback

```text
Chat:
OpenAI → configurable model

Embeddings:
OpenAI → configurable embedding model

Data:
External API processing according to provider configuration

Cost:
Usage-based
```

For healthcare demonstrations using external providers, only synthetic or appropriately anonymized data should be used unless the required legal, contractual, privacy, and hosting conditions have been validated.


# 10.16 AI Query Routing Strategy

The AI Assistant must support multiple query modes.

The implementation must **not** use the simplistic rule:

```text
if documentId != null
    use RAG
else
    call raw LLM
```

Instead, all AI requests must pass through an explicit **AI Query Router**.

```text
User Question
     ↓
AiQueryRouter
     ↓
┌────────────────────────────┐
│ DOCUMENT_CONTEXT           │
│ HEALTH_RECORD              │
│ MEDICAL_KNOWLEDGE          │
│ GENERAL                    │
└────────────────────────────┘
```

The purpose of the router is to select the most appropriate and safest source of information before calling the LLM.

## 10.16.1 DOCUMENT_CONTEXT

Use this mode when the user explicitly asks a question about a selected medical document or result.

Typical entry point: `Ask About This Result`.

Pipeline:

```text
Authenticated Patient
        ↓
Document Authorization
        ↓
Patient Document RAG
        ↓
Retrieve Relevant Chunks
        ↓
Prompt Builder
        ↓
LLM
        ↓
Grounded Answer + Document Sources
```

For `Ask About This Result`, the selected `documentId` should remain the primary retrieval scope.

## 10.16.2 HEALTH_RECORD

Use this mode for questions that can be answered from structured application data rather than document embeddings.

Examples:

```text
When is my next appointment?
Who is my next appointment with?
What appointments do I have this week?
What is my latest medical result?
Which exams are still pending?
```

The application must prefer deterministic application queries over vector search when the requested information already exists as structured data.

```text
User Question
     ↓
AiQueryRouter
     ↓
HEALTH_RECORD
     ↓
AppointmentService / DocumentService / ExamService
     ↓
Structured Result
     ↓
LLM only if natural-language formatting is useful
```

RAG must not replace normal domain queries.

## 10.16.3 MEDICAL_KNOWLEDGE

Use this mode for general educational medical questions or terminology that are not necessarily linked to a patient document.

Examples:

```text
What is ferritin?
What does hyperintense mean?
What is an MRI?
What is a reference range?
What does hemoglobin measure?
```

Preferred pipeline:

```text
User Question
        ↓
Medical Knowledge RAG
        ↓
Approved Medical Knowledge Base
        ↓
Relevant Knowledge Chunks
        ↓
Prompt Builder
        ↓
LLM
        ↓
Educational Explanation + Sources
```

The assistant should prefer an approved and curated medical knowledge base instead of relying exclusively on the LLM's internal knowledge.

For the demo, the knowledge base can remain intentionally small and cover terminology used in the sample demo documents.

## 10.16.4 GENERAL

`GENERAL` is a controlled fallback mode.

It may be used when no patient record, selected document, or relevant approved medical knowledge is required or available.

The response must clearly indicate when it is based on general model knowledge rather than the patient's medical records or the approved knowledge base.

Example:

```text
This is a general educational explanation and is not based on your medical record.
```

`GENERAL` must remain the last fallback, not the default path for all questions without a `documentId`.

The same medical safety restrictions still apply:

- No diagnosis
- No personalized treatment recommendation
- No medication changes
- No replacement for practitioner interpretation

## 10.17 Query Mode Model

Introduce an explicit query mode in the backend.

```java
public enum AiQueryMode {
    DOCUMENT_CONTEXT,
    HEALTH_RECORD,
    MEDICAL_KNOWLEDGE,
    GENERAL
}
```

Suggested request context:

```java
public record AiQueryContext(
    Long patientId,
    Long documentId,
    Long conversationId,
    String question
) {}
```

## 10.18 AiQueryRouter

Suggested abstraction:

```java
public interface AiQueryRouter {
    AiQueryMode route(AiQueryContext context);
}
```

For the demo, keep routing deterministic where possible. Do **not** introduce an extra LLM classification call unless needed later.

Initial routing rules:

```text
documentId present
    → DOCUMENT_CONTEXT

question clearly targets appointments, exams, or known structured patient data
    → HEALTH_RECORD

question asks for medical terminology or general medical explanation
    → MEDICAL_KNOWLEDGE

otherwise
    → GENERAL
```

Future evolution such as semantic intent classification, tool calling, function calling, or agentic orchestration is out of scope for the first demo.

## 10.19 Recommended AI Application Components

```text
ai/
├── api/
│   └── AiChatController
├── application/
│   ├── HealthAssistantService
│   ├── AiQueryRouter
│   ├── DocumentRagService
│   ├── MedicalKnowledgeRagService
│   ├── HealthRecordQueryService
│   └── DocumentIngestionService
├── retrieval/
│   ├── DocumentRagRetriever
│   ├── MedicalKnowledgeRetriever
│   └── HealthRecordRetriever
├── provider/
│   ├── LlmGateway
│   ├── EmbeddingGateway
│   ├── ollama/
│   └── openai/
├── prompt/
│   └── HealthAssistantPromptBuilder
└── domain/
    ├── AiConversation
    ├── AiMessage
    ├── AiQueryMode
    └── AiSource
```

The exact package names may change during implementation, but these responsibilities should remain separated.

## 10.20 Two RAG Scopes

The demo contains two logically separate RAG datasets.

### Patient Document RAG

```text
ragScope = PATIENT_DOCUMENT
patientId
documentId
documentType
page
```

This dataset is subject to strict patient authorization.

### Medical Knowledge RAG

```text
ragScope = MEDICAL_KNOWLEDGE
knowledgeSource
topic
language
version
```

This dataset contains no patient medical records.

Both datasets may use the same PostgreSQL + pgvector infrastructure while remaining logically separated through metadata and application-level retrieval rules.

## 10.21 Medical Knowledge Ingestion

```text
Approved Knowledge Document
        ↓
Parsing
        ↓
Chunking
        ↓
EmbeddingGateway
        ↓
PostgreSQL + pgvector
```

Patient documents require ownership/access checks. Approved medical knowledge is application-level content available according to its configured scope.

## 10.22 Example Query Routing

### Example A

`What does ferritin mean in this result?` with `documentId = 456` → `DOCUMENT_CONTEXT` → Patient Document RAG.

### Example B

`When is my next appointment?` → `HEALTH_RECORD` → AppointmentService / PostgreSQL. No vector retrieval required.

### Example C

`What does hyperintense mean?` with no selected document → `MEDICAL_KNOWLEDGE` → Medical Knowledge RAG.

### Example D

`What is the difference between an MRI and a CT scan?` → `MEDICAL_KNOWLEDGE` if curated knowledge exists, otherwise `GENERAL` with a general-information notice.

### Example E

`Do I have iron deficiency?` must never produce a diagnosis. The assistant may explain relevant document values, reference intervals, and general concepts, but must defer clinical interpretation to a healthcare professional.

## 10.23 Query Routing and Provider Switching

Query routing must remain independent from the selected LLM provider.

```text
Question
   ↓
AiQueryRouter
   ↓
Retrieve Appropriate Context
   ↓
Prompt Builder
   ↓
LlmGateway
   ↓
Ollama OR OpenAI
```

Switching providers must not change business logic, authorization, retrieval rules, or RAG behavior.

## 10.24 Embedding Provider and Indexing Rule

Switching chat providers can be immediate because the retrieved text context remains usable by either LLM.

Switching embedding providers requires re-embedding indexed content because different embedding models use different vector spaces.

For the demo:

```text
Default local vector index
→ qwen3-embedding:0.6b
```

If OpenAI embeddings are tested separately, either rebuild the demo index or maintain a separate vector collection/table/index for that embedding profile.

Do not mix vectors from different embedding models in the same similarity-search index.

## 10.25 Demo Implementation Priority for AI Routing

Implement in this order:

1. `DOCUMENT_CONTEXT`
2. `MEDICAL_KNOWLEDGE`
3. `HEALTH_RECORD`
4. `GENERAL` controlled fallback

The main demo flow remains:

```text
Medical Result
     ↓
Ask About This Result
     ↓
Patient Document RAG
     ↓
Grounded Multi-turn Conversation
```

The second AI demo should show:

```text
General Medical Term
     ↓
Medical Knowledge RAG
     ↓
Educational Explanation
```


# 10. AI Integration Architecture

For the demo, keep the AI integration deliberately simple.

Use a dedicated `ai` module inside the Spring Boot application.

```text
Patient Question
       ↓
AI Controller
       ↓
AI Service
       ↓
Authorization
       ↓
Context Builder
       ↓
Retriever
       ↓
Prompt Builder
       ↓
LLM Gateway
       ↓
Response + Sources
```

---

# 10.1 LLM Provider

The implementation should hide the provider behind an abstraction.

Example interface:

```text
LlmClient
```

Possible initial providers:

- OpenAI
- Azure OpenAI
- Mistral

For the demo, use the provider that is easiest for the team to configure.

Do not spread provider-specific code throughout the application.

---

# 10.2 RAG Strategy

For the demo:

- Upload medical PDF
- Extract text
- Split text into chunks
- Create embeddings
- Store embeddings in PostgreSQL using pgvector
- Retrieve relevant chunks for a user question
- Send retrieved context to the LLM
- Return answer with source references

```text
PDF Upload
    ↓
Text Extraction
    ↓
Chunking
    ↓
Embeddings
    ↓
PostgreSQL + pgvector
    ↓

User Question
    ↓
Authorization
    ↓
Vector Retrieval
    ↓
Relevant Chunks
    ↓
Prompt + Context
    ↓
LLM
    ↓
Grounded Answer
```

---

# 10.3 Recommended AI Libraries

For speed, evaluate one of:

- Spring AI
- LangChain4j

Do not use both.

Recommended demo choice:

> **Spring AI**

Reasons:

- Natural fit with Spring Boot
- Provider abstraction
- Embedding support
- Vector-store integrations
- Chat model abstraction
- RAG building blocks

The final choice can be changed later if required.

---

# 10.4 Document Parsing

For demo PDF extraction:

- Apache PDFBox

If scanned/image-only documents are required, OCR can be added later.

For the first demo, prefer text-based PDF documents.

---

# 10.5 RAG Authorization

The most important rule:

> **Authorization before Retrieval**

The backend must identify which document belongs to the authenticated patient before vector search.

Example:

```text
Authenticated Patient
        ↓
Selected Document
        ↓
Ownership Check
        ↓
Allowed Chunk Scope
        ↓
Vector Search
        ↓
LLM
```

The model must never decide which patient records it may access.

---

# 10.6 AI Conversation Context

For `Ask About This Result`:

```text
conversationId
patientId
documentId
```

The selected `documentId` should remain the primary scope for the conversation.

This makes the demo safer, easier to reason about, and more deterministic.

---

# 10.7 Source References

The AI response should return structured source metadata.

Example:

```json
{
  "answer": "The report lists ferritin at 18 ng/mL...",
  "sources": [
    {
      "documentId": 42,
      "documentTitle": "Blood Test — August 2026",
      "page": 1
    }
  ]
}
```

The Web App should display the sources below the answer.

---

# 11. File Storage

For the demo, two approaches are acceptable.

## Fastest Option

Store uploaded files on the local filesystem or Docker volume.

Good enough for a local/client demo.

## Demo Option

Use S3-compatible object storage:

- MinIO

MinIO is the required object-storage implementation for the demo environment.

Do not store full PDFs directly in PostgreSQL.

PostgreSQL stores metadata and references.

---

# 12. Database Model — Simplified

## User

```text
id
firstName
lastName
email
phone
passwordHash
role
createdAt
```

## Practitioner

```text
id
firstName
lastName
specialty
organization
address
languages
```

## AppointmentSlot

```text
id
practitionerId
startAt
endAt
available
```

## Appointment

```text
id
patientId
practitionerId
appointmentSlotId
reason
status
createdAt
```

## MedicalDocument

```text
id
patientId
practitionerId
title
documentType
documentDate
storagePath
mimeType
createdAt
```

## DocumentChunk

```text
id
documentId
chunkIndex
content
embedding
```

## AiConversation

```text
id
patientId
documentId
createdAt
```

## AiMessage

```text
id
conversationId
role
content
createdAt
```

---

# 13. Suggested REST API

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/users/me
```

## Practitioners

```http
GET /api/practitioners
GET /api/practitioners/{id}
GET /api/practitioners/{id}/slots
```

## Appointments

```http
GET    /api/appointments/me
POST   /api/appointments
DELETE /api/appointments/{id}
```

## Medical Documents

```http
GET  /api/documents/me
GET  /api/documents/{id}
POST /api/admin/documents
GET  /api/documents/{id}/download
```

## AI

```http
POST /api/ai/chat
POST /api/ai/documents/{documentId}/chat
GET  /api/ai/conversations/{id}
```

## Admin

```http
GET    /api/admin/patients
GET    /api/admin/appointments
POST   /api/admin/practitioners
PUT    /api/admin/practitioners/{id}
DELETE /api/admin/practitioners/{id}

POST   /api/admin/practitioners/{id}/slots
PUT    /api/admin/slots/{id}
DELETE /api/admin/slots/{id}
```

---

# 14. Demo Pages

## Public / Patient

- Sign Up
- Sign In
- Patient Home
- Practitioner List
- Practitioner Details
- Appointment Booking
- My Appointments
- My Medical Results
- Medical Result Details
- AI Result Chat

## Admin

- Admin Dashboard
- Practitioner Management
- Appointment Slot Management
- Patient List
- Appointment List
- Medical Document Upload

---

# 15. Demo Scenario

The recommended live demo is:

## Step 1 — Registration

Create a new patient account.

## Step 2 — Practitioner Search

Browse practitioners and open a cardiologist profile.

## Step 3 — Appointment Booking

Select a predefined available slot and confirm the appointment.

## Step 4 — Appointment View

Open `My Appointments` and show the newly booked appointment.

## Step 5 — Admin Upload

Switch to admin and upload a sample blood-test PDF for the patient.

## Step 6 — Patient Result

Return to the patient account and open the newly available result.

## Step 7 — AI Explanation

Click:

> **Ask About This Result**

Ask:

> Explain this result in simple terms.

Then:

> Which values are outside the reference range?

Then:

> What does ferritin mean?

The assistant should answer using retrieved content and display source references.

---

# 16. Implementation Strategy with Codex

Implement in small vertical increments.

## Step 1 — Technical Bootstrap

- Spring Boot project
- React project
- PostgreSQL
- Liquibase
- Docker Compose
- Authentication foundation
- Base UI layout

## Step 2 — Authentication

- Registration
- Login
- JWT
- Patient/Admin roles

## Step 3 — Practitioners

- Practitioner CRUD
- Practitioner list/details
- Seed data

## Step 4 — Appointments

- Appointment slots
- Booking
- My Appointments
- Cancellation

## Step 5 — Documents

- Upload
- Metadata
- Patient result list
- Download/view

## Step 6 — AI / RAG

- PDF parsing
- Chunking
- Embeddings
- pgvector
- LLM gateway
- RAG retrieval
- `Ask About This Result`
- Source references

## Step 7 — Back Office

- Practitioner management
- Slot management
- Patient list
- Appointment list
- Document upload

## Step 8 — Demo Polish

- Seed data
- Loading/error states
- Responsive layout
- Demo accounts
- README
- Demo script

---

# 17. Suggested Repository Structure

For the demo, a monorepo is recommended.

```text
health-companion/
├── backend/
├── web-app/
├── docs/
├── docker-compose.yml
└── README.md
```

Optional:

```text
health-companion/
├── backend/
├── web-app/
├── docs/
├── sample-data/
│   └── medical-results/
├── docker/
└── docker-compose.yml
```

---

# 18. Demo Infrastructure

Recommended local/demo environment:

```text
macOS
└── Ollama
    ├── qwen3:4b
    └── qwen3-embedding:0.6b

Docker Compose
├── PostgreSQL + pgvector
├── MinIO
├── Backend (optional during development)
└── Web App (optional during development)
```

For local development, running Spring Boot and the React dev server directly on macOS is also acceptable while PostgreSQL and MinIO remain in Docker Compose.

The application must also support OpenAI through configuration as a reference/fallback AI provider.

Kubernetes is not required for the demo.

---

# 19. Demo Success Criteria

The demo is successful if the client can see:

1. Patient registration
2. Secure login
3. Practitioner list
4. Appointment booking
5. My Appointments
6. Medical result availability
7. Medical result viewing
8. `Ask About This Result`
9. A multi-turn RAG conversation
10. Source-grounded AI responses
11. Clear AI safety boundaries
12. A minimal admin back office

---

# 20. Recommended Demo Positioning

The demo should communicate:

> **Health Companion brings appointment access, patient medical records, and AI-powered result explanations into one secure digital experience.**

The key differentiator to showcase is:

```text
Appointment Booking
        +
Medical Results
        +
Patient-Owned Documents
        +
Contextual AI / RAG
```

The AI Assistant should be demonstrated as a tool that helps patients **understand their own medical information**, while leaving diagnosis and medical decisions to healthcare professionals.
