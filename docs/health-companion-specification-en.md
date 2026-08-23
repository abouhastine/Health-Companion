# Health Companion — Product & Technical Specification

## 1. Product Vision

**Health Companion** is a secure digital healthcare platform designed initially for the Tunisian market.

The platform connects patients, healthcare practitioners, and healthcare organizations around four core capabilities:

1. **Healthcare access and appointment management**
2. **Medical exams, results, and document management**
3. **A longitudinal patient health record**
4. **An AI-powered Health Assistant using LLM and RAG**

The product takes inspiration from modern digital healthcare platforms such as Doctolib for appointment and patient-document workflows, while defining its own product experience and architecture for the Tunisian healthcare ecosystem.

Health Companion is not intended to replace healthcare professionals. Its AI capabilities are designed to help patients find, understand, organize, and discuss their own health information without providing a medical diagnosis, treatment decision, or medical opinion.

The target product is a **Web App + Mobile App** backed by a shared API and a scalable backend architecture.

---

## 2. Product Principles

### 2.1 Patient First

The product experience should be designed around the patient's healthcare journey rather than the internal structure of healthcare organizations.

### 2.2 Privacy by Design

Health data is sensitive data. Security, confidentiality, authorization, traceability, and data minimization must be considered from the beginning of the project.

### 2.3 Explicit Consent

Access to medical information and document sharing must be controlled through explicit authorization and consent mechanisms.

### 2.4 AI as an Assistant

The AI Assistant must help users understand and navigate health information. It must not present itself as a doctor or replace professional medical advice.

### 2.5 Grounded AI

When answering questions about a patient's records, the AI must ground its answers in authorized patient data and/or approved medical knowledge.

### 2.6 Source Transparency

Where applicable, AI responses should clearly indicate which patient document, result, or approved knowledge source supports the response.

### 2.7 Human in the Loop

Clinical decisions remain the responsibility of qualified healthcare professionals.

### 2.8 Multilingual by Design

The product should be designed from the beginning for:

- French
- Arabic
- English as a possible additional language

Arabic support must include **Right-to-Left (RTL)** layouts.

---

## 3. User Roles

### PATIENT

A patient using the platform to manage appointments, exams, results, documents, and interactions with the Health Assistant.

### PRACTITIONER

A healthcare professional such as:

- General Practitioner
- Specialist
- Dentist
- Midwife
- Physiotherapist
- Other authorized healthcare professional

### SECRETARY

Administrative staff managing appointments and practitioner schedules.

### HEALTHCARE_ORGANIZATION_ADMIN

Administrator of a healthcare organization such as:

- Private Practice
- Medical Center
- Clinic
- Laboratory
- Imaging Center
- Hospital

### PLATFORM_ADMIN

Platform-level administration and support role.

---

# 4. Product Scope

The initial product is organized around the following functional domains:

1. **Identity & Patient Profile**
2. **Healthcare Directory**
3. **Appointment Management**
4. **Medical Exams & Results**
5. **Medical Documents**
6. **Patient Health Record & Timeline**
7. **AI Health Assistant**
8. **Practitioner Workspace**
9. **Notifications**
10. **Consent, Security & Audit**

---

# 5. Identity & Patient Profile

## 5.1 Patient Registration

A patient can create an account using:

- First name
- Last name
- Date of birth
- Gender
- Phone number
- Email address
- Password

Phone-based registration should be considered important for the Tunisian market.

OTP verification may be used to verify the phone number.

## 5.2 Authentication

Supported or planned authentication methods:

- Email + Password
- Phone Number + Password
- OTP
- Mobile biometrics in a later phase
- MFA for sensitive operations or privileged users

## 5.3 Patient Profile

The patient profile may contain:

- First name
- Last name
- Date of birth
- Gender
- Phone number
- Email
- Address
- Emergency contact
- Preferred language

## 5.4 Family Profiles

A patient account may later manage authorized dependent profiles such as:

- Children
- Parents
- Spouse
- Dependent persons

Each profile must remain logically separated with its own health data and authorization rules.

**Target phase:** Phase 2.

---

# 6. Healthcare Directory

## 6.1 Practitioner Search

Patients must be able to search by:

- Practitioner name
- Specialty
- Location
- Healthcare organization
- Availability

## 6.2 Specialties

Examples:

- General Practice
- Cardiology
- Neurology
- Gynecology
- Dermatology
- Pediatrics
- Ophthalmology
- Dentistry
- Radiology

The specialty catalog must be configurable.

## 6.3 Healthcare Organizations

Supported organization types may include:

- Private Practice
- Medical Center
- Clinic
- Hospital
- Laboratory
- Imaging Center

## 6.4 Practitioner Profile

A practitioner profile may display:

- Full name
- Specialty
- Sub-specialties
- Photo
- Healthcare organization
- Address
- Map location
- Languages
- Consultation types
- Accepted payment methods
- Available appointment slots

---

# 7. Appointment Management

Appointment management is one of the core modules of Health Companion.

## 7.1 Practitioner Agenda

Practitioners or authorized staff must be able to configure:

- Working days
- Opening hours
- Appointment duration
- Unavailable periods
- Holidays
- Emergency slots
- Appointment types

## 7.2 Appointment Types

Examples:

- `FIRST_CONSULTATION`
- `FOLLOW_UP`
- `MEDICAL_EXAMINATION`
- `RESULT_REVIEW`
- `PROCEDURE`
- `VIDEO_CONSULTATION`
- `OTHER`

Appointment types must be configurable per practitioner and organization.

## 7.3 Online Booking

The patient booking flow should be:

1. Select practitioner or healthcare organization
2. Select appointment type
3. Select date
4. Select available time slot
5. Select patient profile
6. Provide reason for visit
7. Attach optional documents
8. Confirm appointment

## 7.4 Appointment Status

```text
REQUESTED
CONFIRMED
CANCELLED
COMPLETED
NO_SHOW
RESCHEDULED
```

## 7.5 Appointment Details

An appointment contains:

- Patient
- Practitioner
- Healthcare organization
- Appointment type
- Date
- Start time
- End time
- Reason
- Status
- Instructions
- Attached documents
- Created timestamp
- Updated timestamp

## 7.6 Appointment Management

Patients must be able to:

- View upcoming appointments
- View appointment history
- Cancel an appointment according to applicable rules
- Reschedule an appointment
- Access preparation instructions
- Attach requested documents

Practitioners and authorized staff must be able to:

- Confirm appointments
- Cancel appointments
- Reschedule appointments
- Mark appointments as completed
- Mark no-shows

## 7.7 Appointment Reminders

Supported notification events:

- Booking confirmation
- Appointment reminder
- Appointment modification
- Cancellation
- New preparation instruction

Potential channels:

- Push Notification
- SMS
- Email

## 7.8 Waiting List

A patient may request:

> Notify me if an earlier appointment becomes available.

The platform can later notify eligible patients when a slot is released.

**Target phase:** Phase 2.

## 7.9 Waiting Room

Potential statuses:

```text
EXPECTED
CHECKED_IN
WAITING
IN_CONSULTATION
COMPLETED
```

**Target phase:** Phase 2.

---

# 8. Medical Exams & Results

An **Exam** is a business entity. A PDF, image, or report associated with the exam is a **Medical Document**.

This distinction should be preserved in the data model.

## 8.1 Exam Categories

```text
LAB_TEST
MEDICAL_IMAGING
PATHOLOGY
CARDIOLOGY_TEST
FUNCTIONAL_TEST
OTHER
```

## 8.2 Exam Information

An exam may contain:

- Patient
- Exam type
- Prescribing practitioner
- Performing organization
- Requested date
- Scheduled date
- Performed date
- Result date
- Status
- Associated medical documents

## 8.3 Exam Status

```text
PRESCRIBED
SCHEDULED
PERFORMED
RESULT_PENDING
RESULT_AVAILABLE
REVIEWED
CANCELLED
```

## 8.4 Patient Exam Experience

Patients must be able to:

- View prescribed exams
- View upcoming exams
- View completed exams
- Access available results
- Access associated documents
- Open the AI Assistant directly from a result
- Ask questions about a result
- Compare compatible results over time

---

# 9. Medical Documents

## 9.1 My Health Documents

Patients must have a centralized document space containing:

- Uploaded documents
- Documents received from practitioners
- Laboratory results
- Imaging reports
- Prescriptions
- Other health documents

## 9.2 Document Types

```text
PRESCRIPTION
LAB_RESULT
IMAGING_RESULT
MEDICAL_REPORT
REFERRAL_LETTER
DISCHARGE_SUMMARY
CERTIFICATE
VACCINATION_RECORD
OTHER
```

## 9.3 Document Upload

Possible upload sources:

- Web file upload
- Mobile file upload
- Mobile camera
- Healthcare practitioner
- Laboratory
- Imaging center
- External integration in a later phase

Initially supported formats:

- PDF
- JPEG
- PNG

DICOM support may be evaluated later for medical imaging.

## 9.4 Document Metadata

Each document should contain metadata such as:

- Patient
- Title
- Document type
- Document date
- Healthcare provider
- Practitioner
- Upload source
- MIME type
- File size
- Tags
- Access permissions
- Created timestamp

## 9.5 Secure Document Sharing

Patients must be able to share eligible documents with authorized healthcare professionals.

A sharing grant should record:

- Document
- Patient
- Recipient
- Granted timestamp
- Expiration timestamp when applicable
- Revocation timestamp
- Scope

All access must be auditable.

---

# 10. Patient Health Record & Timeline

Health Companion should progressively build a longitudinal view of the patient's healthcare journey.

## 10.1 Health Timeline

The timeline may aggregate:

- Appointments
- Exams
- Results
- Prescriptions
- Medical documents

Example:

```text
12 Jan — Cardiology Consultation
15 Jan — Blood Test
16 Jan — Lab Result Available
22 Jan — Chest CT
25 Jan — Prescription
```

## 10.2 Patient Dashboard

The patient Dashboard should provide a concise view of relevant information.

### Upcoming Appointment

- Practitioner
- Specialty
- Date
- Time
- Location

### Pending Exams

- Exam
- Requested date
- Due date when applicable

### New Results

- Newly available results
- Unread results

### Recent Documents

- Recently received or uploaded documents

### Quick Actions

- `Book Appointment`
- `Upload Document`
- `View Results`
- `Ask Health Assistant`

---

# 11. Practitioner Workspace

## 11.1 Practitioner Dashboard

The practitioner Dashboard may display:

- Today's Appointments
- Waiting Patients
- Upcoming Appointments
- Patient Requests
- Recently Received Documents
- Tasks

## 11.2 Patient Overview

When authorized, the practitioner may access:

- Patient identity
- Relevant appointments
- Exams
- Results
- Shared documents
- Prescriptions
- Timeline

The initial goal is not to build a complete Electronic Health Record (EHR), but a lightweight patient health record supporting the platform's workflows.

## 11.3 Result & Document Upload

Authorized professionals and organizations may:

- Upload exam results
- Upload medical reports
- Upload prescriptions
- Associate documents with an appointment or exam
- Notify the patient when a result becomes available

---

# 12. AI Health Assistant

The **AI Health Assistant** is a core differentiating capability of Health Companion.

It must not be positioned as an **AI Doctor**.

Its purpose is to help patients:

- Find information in their health record
- Understand medical documents
- Understand terminology
- Clarify medical results
- Compare factual information across their own records
- Prepare questions for a healthcare professional

The assistant must not provide a diagnosis, prescribe treatment, or replace professional medical interpretation.

---

# 13. AI Assistant — Core Experiences

The AI Assistant should support two primary interaction modes.

## 13.1 Ask About My Health Records

The patient can ask questions across authorized personal health data.

Examples:

> When is my next appointment?

> What exams are still pending?

> Find my latest blood test.

> When was my last MRI?

> Which documents did I receive after my last consultation?

The system may retrieve information from:

- Appointments
- Exams
- Results
- Medical documents
- Prescriptions

## 13.2 Ask About This Result

Every eligible medical result or document should expose an action such as:

**Ask about this result**

The selected result becomes the primary conversation context.

Suggested questions may include:

- Explain this result in simple terms
- Which values are outside the reference range?
- What does this medical term mean?
- Summarize the conclusion
- Compare this result with my previous one
- What questions could I ask my doctor?

This contextual mode should be preferred over an unrestricted generic medical chatbot.

---

# 14. AI Medical Result Explainer

## 14.1 Purpose

The Medical Result Explainer helps patients understand the content of their own medical results without providing a medical opinion.

## 14.2 Supported Capabilities

The assistant may:

- Explain medical terminology appearing in the document
- Reformulate technical content in plain language
- Summarize a result or report
- Explain the purpose of a measurement in general terms
- Identify values explicitly shown as above or below a reference range
- Explain sections of an imaging or laboratory report
- Answer follow-up questions about the selected document
- Compare factual values with previous compatible results
- Retrieve relevant information from previous authorized records
- Suggest questions the patient may want to discuss with a healthcare professional

## 14.3 Example Conversation

```text
Patient:
What does ferritin mean?

Assistant:
Ferritin is a protein that stores iron. A ferritin blood test is commonly
used as one indicator of the body's iron stores.

Patient:
Mine is 18. Is that low?

Assistant:
Your uploaded laboratory report shows a ferritin value of 18 ng/mL and
lists a reference range of 20–150 ng/mL. Based on the reference interval
shown in this document, the reported value is below that range.

This comparison does not determine the cause or provide a diagnosis.
A healthcare professional can interpret it together with your symptoms,
medical history, and other results.

Patient:
What else might my doctor review?

Assistant:
Clinicians may consider ferritin alongside other information such as
hemoglobin, serum iron, or transferrin saturation.

I cannot determine which interpretation applies to you, but I can check
whether those values are present in your authorized results.
```

---

# 15. AI Response Structure

Where relevant, responses should distinguish between three categories.

## From Your Result

Information directly extracted from the patient's document.

Example:

```text
Ferritin: 18 ng/mL
Reference range shown by the laboratory: 20–150 ng/mL
```

## General Explanation

General educational information grounded in approved medical knowledge.

Example:

```text
Ferritin is a protein involved in iron storage and is commonly measured
as one indicator of iron stores.
```

## What the AI Cannot Determine

Explicit boundary between explanation and clinical interpretation.

Example:

```text
This result alone does not establish a diagnosis or determine the cause.
A healthcare professional should interpret it in the context of your
medical history, symptoms, and other results.
```

This structure is preferred over relying exclusively on a generic disclaimer.

---

# 16. Longitudinal Result Comparison

The assistant may compare compatible measurements across authorized patient records.

Example query:

> Has my ferritin increased since my previous test?

Possible factual output:

```text
January 2026 — 11 ng/mL
May 2026     — 15 ng/mL
August 2026  — 18 ng/mL
```

The assistant may state:

> The ferritin values available in your records increased from 11 ng/mL in January to 18 ng/mL in August.

It must not automatically conclude:

> Your condition is improving.

Clinical interpretation remains outside the assistant's scope.

Structured health values should be preferred over extracting values from free text whenever structured data is available.

---

# 17. AI Safety Boundaries

## 17.1 Allowed Behaviors

The assistant may:

- Explain
- Summarize
- Retrieve
- Compare factual data
- Clarify terminology
- Identify document-provided reference ranges
- Generate questions for a practitioner
- Provide general educational information from approved sources

## 17.2 Prohibited Behaviors

The assistant must not:

- Provide a definitive diagnosis
- Claim that a patient has a disease based on a result
- Prescribe medication
- Recommend changing medication or dosage
- Replace a medical consultation
- Present a treatment plan as medical advice
- Claim that a patient's condition is improving or worsening solely from isolated values
- Provide false certainty when source information is incomplete

## 17.3 Uncertainty

When information is missing or ambiguous, the assistant must state that clearly rather than infer unsupported conclusions.

## 17.4 Emergency Escalation

Potential emergency messages require a dedicated safety workflow.

```text
Potential Emergency
        ↓
Safety Classification
        ↓
Interrupt Normal AI Flow
        ↓
Display Approved Emergency Guidance
        ↓
Direct User Toward Appropriate Emergency Care
```

Emergency handling must not rely exclusively on the generative model.

---

# 18. RAG Architecture

The AI Assistant should use **Retrieval-Augmented Generation (RAG)** to ground responses.

## 18.1 Patient Record RAG

```text
Patient Question
       ↓
Authentication
       ↓
Authorization
       ↓
Allowed Patient Resources
       ↓
Retrieval
       ↓
Relevant Record Context
       ↓
LLM
       ↓
Grounded Answer + Sources
```

The key architectural rule is:

> **Authorization before Retrieval.**

The LLM must never decide which patient records the user is authorized to access.

## 18.2 Medical Knowledge RAG

A separate approved knowledge base may contain:

- Validated medical educational content
- Healthcare organization FAQs
- Administrative procedures
- Internal protocols where appropriate
- Curated medical reference content approved by the client

Architecture:

```text
Approved Knowledge Sources
          ↓
       Ingestion
          ↓
       Parsing
          ↓
       Chunking
          ↓
      Embeddings
          ↓
     Vector Store
          ↓
Patient Question
          ↓
      Retrieval
          ↓
       Reranking
          ↓
          LLM
          ↓
 Answer + Source References
```

Patient-record retrieval and general medical knowledge retrieval should remain logically distinguishable.

---

# 19. RAG Security & Data Isolation

Retrieved content must always respect application authorization rules.

Relevant metadata may include:

```text
tenantId
organizationId
patientId
documentId
documentType
accessScope
```

A patient query must never retrieve another patient's records.

Practitioner access must be limited to patients and resources for which access has been explicitly granted or legally authorized.

Vector search must not bypass backend authorization.

---

# 20. AI Audit Trail

Sensitive AI interactions must be auditable.

Possible audit information:

- User ID
- User role
- Organization ID when applicable
- Timestamp
- Conversation ID
- Prompt category
- Retrieved resource IDs
- Model/provider
- Response status
- Safety flags
- Latency
- Token usage

Retention of full prompts and responses must be explicitly defined according to privacy, legal, security, and product requirements.

Sensitive content should not be logged by default without a justified purpose.

---

# 21. AI Provider Abstraction

The AI layer should not be tightly coupled to one LLM provider.

```text
AI Service
   │
   ├── LLM Gateway
   │      ├── Provider A
   │      ├── Provider B
   │      └── Self-hosted Model
   │
   ├── Embedding Provider
   ├── Retrieval
   ├── Reranking
   ├── Guardrails
   └── Audit
```

Provider selection may depend on:

- Data residency
- Privacy requirements
- Cost
- Performance
- French capabilities
- Arabic capabilities
- Model quality
- Availability

---

# 22. AI Components

Potential components include:

- Document Parser
- OCR when required
- Document Classification
- Chunking Service
- Embedding Service
- Vector Store
- Retriever
- Reranker
- Prompt Builder
- LLM Gateway
- Citation Builder
- Safety / Guardrail Layer
- Conversation Service
- Audit Service

---

# 23. Technical Architecture

For the initial product, a **Modular Monolith** is preferred over premature microservices.

Suggested backend modules:

```text
identity
patients
practitioners
organizations
appointments
exams
documents
notifications
consent
ai
audit
```

This keeps deployment and development simple while preserving clear module boundaries.

Modules such as `ai`, `documents`, or `notifications` may later be extracted into independent services if scale or organizational requirements justify it.

---

# 24. High-Level Architecture

```text
              Web App
                 │
             Mobile App
                 │
                 ▼
              Backend
                 │
     ┌───────────┼────────────┐
     │           │            │
     ▼           ▼            ▼
 Business     Document      AI Module
 Modules       Module
     │           │            │
     │           │       ┌────┴─────┐
     │           │       │          │
     │           │    RAG Layer  LLM Gateway
     │           │       │          │
     └─────┬─────┴───────┴──────────┘
           │
     PostgreSQL
           │
     Object Storage
           │
   Vector Capabilities
```

---

# 25. Backend Stack

Target backend stack:

- Java 21
- Spring Boot 3
- Maven
- Spring Web
- Spring Security
- Spring Data JPA
- Hibernate
- PostgreSQL
- Liquibase
- MapStruct
- Bean Validation
- OpenAPI / Swagger
- JUnit 5
- Mockito
- Testcontainers

---

# 26. Database Strategy

## 26.1 Relational Database

**PostgreSQL** is the primary relational database.

It stores:

- Users
- Patient profiles
- Practitioners
- Organizations
- Appointments
- Exams
- Document metadata
- Permissions
- Consent records
- Audit metadata
- Structured medical values where applicable

## 26.2 Database Migrations

Database schema changes are managed through **Liquibase**.

## 26.3 Vector Search

For an initial implementation, **PostgreSQL + pgvector** should be evaluated to reduce infrastructure complexity.

Possible future alternatives:

- Qdrant
- OpenSearch
- Weaviate

The vector technology should remain replaceable behind an application abstraction.

---

# 27. Medical File Storage

Medical files should not be stored directly as database binary objects unless a specific requirement justifies it.

Recommended approach:

```text
PostgreSQL
    ↓
Document Metadata

Object Storage
    ↓
Encrypted Medical Files
```

Development may use S3-compatible storage such as MinIO.

Production storage must be selected according to security, residency, contractual, and Tunisian regulatory requirements.

---

# 28. Web App Stack

Suggested stack:

- React
- TypeScript
- Vite
- Material UI
- React Router
- TanStack Query
- React Hook Form
- Zod

The Design System must support:

- Responsive layouts
- Accessibility
- French
- Arabic
- RTL layouts
- Healthcare-specific status components
- Secure document interactions

---

# 29. Mobile App

The mobile technology should be selected according to the client's roadmap.

## Option A — Native Android

- Kotlin
- Jetpack Compose
- Hilt
- Retrofit
- Kotlin Coroutines
- DataStore

## Option B — Cross-Platform

If both Android and iOS are required early:

- Flutter

or

- React Native

The decision should be captured in an Architecture Decision Record (ADR).

---

# 30. Notifications

The notification module should support events such as:

- Appointment confirmation
- Appointment reminder
- Appointment cancellation
- Appointment rescheduling
- Exam reminder
- Result available
- New document available
- Document shared
- Security notification

Potential channels:

- Push Notification
- SMS
- Email

Notification preferences should be configurable where appropriate.

---

# 31. Consent Management

Consent must be treated as a first-class domain.

Possible consent types:

```text
DOCUMENT_SHARING
PRACTITIONER_ACCESS
AI_PROCESSING
RESEARCH
MARKETING
```

A consent record may contain:

```text
patientId
consentType
scope
version
grantedAt
revokedAt
```

AI processing consent should be designed according to the final legal basis and regulatory assessment.

---

# 32. Security Requirements

Minimum target requirements include:

- TLS for all external communication
- Secure password hashing
- RBAC
- Fine-grained resource authorization
- MFA capability
- Encryption at rest
- Encryption in transit
- Secure session management
- Session/device revocation
- Audit logs
- Medical document access logging
- Secrets management
- Rate limiting
- File type validation
- Malware scanning for uploaded files
- Encrypted backups
- Least-privilege access
- Security monitoring

Security-sensitive operations must be enforced on the backend and never rely only on frontend controls.

---

# 33. Compliance Considerations — Tunisia

Health Companion handles sensitive personal and health information and therefore requires dedicated legal and compliance validation before production deployment.

Areas requiring formal review include:

- Personal data protection
- Health data processing
- Patient consent
- Medical confidentiality
- Data retention
- Patient access to medical records
- Data hosting
- International data transfers
- Sub-processors
- Audit logs
- AI processing
- Telemedicine if introduced
- Required procedures with the relevant Tunisian authorities, including the INPDP where applicable

Compliance requirements must influence architecture, hosting, contracts, operational procedures, and AI provider selection.

This specification identifies engineering and product requirements and does not replace legal advice.

---

# 34. Telemedicine

Telemedicine should initially remain outside the MVP.

The data model may nevertheless anticipate consultation modes such as:

```text
IN_PERSON
VIDEO
```

A future phase may introduce:

- Video Consultation
- Virtual Waiting Room
- Secure Consultation Documents
- Post-consultation document exchange

Telemedicine must be treated as a dedicated regulatory and product workstream.

---

# 35. Phase 1 — MVP

## Patient

- Sign Up / Sign In
- Patient Profile
- Practitioner Search
- Practitioner Profile
- Appointment Booking
- Appointment Management
- Appointment Reminders
- Medical Documents
- Exams & Results
- Patient Dashboard
- Basic Health Timeline

## Practitioner

- Practitioner Profile
- Availability Management
- Agenda
- Appointment List
- Authorized Patient Documents
- Result Upload
- Medical Document Upload

## AI

- AI Health Assistant
- `Ask About My Health Records`
- `Ask About This Result`
- Medical Result Explainer
- Medical Document Summarization
- Medical Terminology Explanation
- Result Reference Range Explanation
- Basic Longitudinal Result Comparison
- Appointment-related Assistant
- RAG over authorized patient records
- RAG over approved medical knowledge
- Source references
- Safety boundaries
- AI audit trail

---

# 36. Phase 2

Potential Phase 2 capabilities:

- Family Profiles
- Waiting List
- Waiting Room
- Secure Messaging
- Advanced Health Timeline
- Advanced Notifications
- Practitioner AI Assistant
- Advanced longitudinal health data visualization
- Laboratory integrations
- Imaging center integrations
- Pharmacy integrations
- More advanced consent management

---

# 37. Phase 3

Potential Phase 3 capabilities:

- Telemedicine
- AI Consultation Assistant for practitioners
- Medical dictation
- Automated document classification
- Advanced RAG
- Advanced structured medical data extraction
- Clinical interoperability
- External healthcare system integration
- HL7 / FHIR APIs
- Organization analytics
- Advanced administration
- Multi-tenant enterprise capabilities

---

# 38. Out of Scope for the Initial AI Assistant

The initial AI Assistant must not attempt to provide:

- Medical diagnosis
- Differential diagnosis
- Medication prescription
- Medication dosage changes
- Personalized treatment recommendations
- Autonomous clinical decisions
- Replacement for practitioner interpretation
- Unsupervised emergency triage
- Unrestricted internet-based medical advice

---

# 39. MVP Success Criteria

The MVP is successful if a patient can:

1. Create and authenticate an account
2. Search for a practitioner
3. Book an appointment
4. Manage upcoming appointments
5. Upload a medical document
6. Receive an exam result or document
7. View exams and results
8. View a basic health timeline
9. Open a result and select **Ask about this result**
10. Ask follow-up questions about that result
11. Receive explanations grounded in the selected document
12. Distinguish document facts from general explanations
13. Compare supported values with previous authorized results
14. Access source references
15. Control access to eligible health information

The MVP is successful if a practitioner can:

1. Manage a practitioner profile
2. Manage availability
3. View appointments
4. Access authorized patient information
5. Upload results and medical documents
6. Associate documents with exams or appointments

The AI component is successful if it:

1. Retrieves only authorized data
2. Grounds patient-record answers in source data
3. Clearly communicates uncertainty
4. Does not provide diagnoses or treatment recommendations
5. Supports multi-turn questions about a selected result
6. Provides traceable source references
7. Produces auditable AI interactions
8. Supports French and is architecturally ready for Arabic

---

# 40. Product Positioning

Health Companion should not be positioned merely as a local appointment-booking application.

The broader value proposition is:

> **A secure digital healthcare companion connecting patients, practitioners, appointments, medical records, exams, results, and trusted AI-powered explanations in one platform.**

The differentiating combination is:

```text
Healthcare Access
        +
Appointment Management
        +
Longitudinal Health Record
        +
Medical Documents & Results
        +
AI-Powered Result Explanation
        +
Secure RAG
        +
Tunisian Healthcare Ecosystem
```

The AI differentiator is not an **AI Doctor**.

It is an **AI-powered Health Record Companion** that helps patients understand and navigate their own healthcare information while keeping medical interpretation and clinical decisions with qualified healthcare professionals.
