# Health Companion MVP — Implementation Status

## Current product shape

The MVP provides patient registration, practitioner appointment booking, medical-document storage, and a general health-information chatbot. The chatbot is authenticated, preserves recent conversation history, and applies safety restrictions. It does not access patient records, documents, curated knowledge, embeddings, or retrieval systems.

| Area | Status | Notes |
|---|---|---|
| Authentication and roles | Complete | Patient and administrator access controls |
| Appointments | Complete | Practitioner availability and booking lifecycle |
| Medical documents | Complete | Admin upload/metadata management; patient preview and download |
| General chatbot | Complete | `POST /api/ai/chat`, conversation history, deletion, and safety filtering |
| AI audit events | Complete | Provider and safety-block status are recorded |
| RAG and document AI | Removed | No embeddings, vectors, source citations, reindexing, or result chat |

## Runtime configuration

Use `demo,local-ai` for Ollama or `demo,openai` for OpenAI. Only chat provider/model configuration is required. PostgreSQL retains the pgvector image solely to support historical Liquibase bootstrap migrations; the current schema removes the extension and vector data.
