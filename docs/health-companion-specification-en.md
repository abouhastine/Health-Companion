# Health Companion — Product Specification

Health Companion is a healthcare platform for appointment management, medical-document storage, and general health education. It is designed around patient privacy, authorization, and clear separation between platform data and chatbot responses.

## Core capabilities

- Secure patient and administrator accounts
- Practitioner profiles, availability, and appointment booking
- Private patient medical-document upload, metadata management, preview, and download
- An authenticated general health-information chatbot with patient-owned conversation history

## AI policy

The chatbot is not a doctor and cannot provide diagnoses, prescriptions, treatment recommendations, or medication-change guidance. It does not read patient records, appointments, medical documents, or any external/curated retrieval source. Responses are general educational content only and are subject to safety filtering.

## Architecture

The shared API is implemented with Spring Boot and PostgreSQL; MinIO stores document files; React/Vite provides the web interface. Ollama or OpenAI is selected as the chat-completion provider. Retrieval-augmented generation, embeddings, vectors, document indexing, citations, and result-specific chat are intentionally outside the product scope.
