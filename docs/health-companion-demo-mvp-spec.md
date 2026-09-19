# Health Companion — Demo MVP Specification

## Purpose

This web MVP demonstrates patient registration, practitioner discovery and booking, medical-document storage, and a general health-information chatbot.

## User flows

Patients can register, manage their profile, view practitioners and available slots, book appointments, view their appointments, and view or download their medical documents. Administrators can manage practitioners, availability, patient accounts, appointments, and document metadata/uploads.

Patients can open the Health Assistant and ask general health-information questions. The assistant stores patient-owned conversation history for continuity, but it does not access appointments, documents, medical results, or any other patient-record data.

## Assistant boundaries

- The assistant provides general educational information only.
- It must not diagnose, prescribe, recommend treatment, or advise medication changes.
- Safety filtering may replace unsafe questions or generated content with a boundary response.
- The assistant does not use document retrieval, embeddings, vectors, a curated knowledge base, citations, or result-specific chat.

## Technical shape

The API is Spring Boot, the client is React/Vite, PostgreSQL stores application data, and MinIO stores PDFs. Ollama or OpenAI supplies chat completions. `POST /api/ai/chat` is the only answer-generation route; conversation history and deletion remain available under `/api/ai/conversations/{id}`.
