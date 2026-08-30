# Bootstrap audit: Health Companion vs Rider Companion

This audit compares the technical foundation in Health Companion with the useful conventions in
`Rider-companion`. Domain code was not copied: the two products have different models, and Rider's
local H2 profile is not suitable for Health Companion's pgvector queries.

| Area | Rider Companion reference | Health Companion adaptation |
| --- | --- | --- |
| Maven | Wrapper scripts and repeatable commands | Maven 3.9.16 wrapper generated under `backend/` |
| API docs | Springdoc/Swagger configuration | Swagger UI, OpenAPI metadata, and JWT scheme |
| Runtime diagnostics | Basic server configuration | Actuator health/info, proxy-header support, upload limits, Problem Details |
| Database | PostgreSQL config, but local development defaults to H2 | PostgreSQL/pgvector remains authoritative in every schema integration test |
| Liquibase | Master file plus forward-only changes | Existing history retained; a new changeset adds FK access indexes, chunk uniqueness, and slot-time validation |
| Seed data | Local persistence conventions | Demo fixtures moved behind an explicit `demo` profile to avoid production credentials |
| Frontend entry point | Providers, theme, services, routes, feature directories | Strict entry point, MUI/Query providers, feature-owned page modules and schemas, typed services/types, versioned session |
| Forms | React Hook Form and Zod | Dependencies wired and authentication forms migrated with accessible field errors |
| Quality tooling | ESLint, Prettier, Vitest, Testing Library | Equivalent lint/format/test/coverage/build gate, with passing bootstrap tests |
| API boundary | Axios abstraction | A typed fetch boundary retained to avoid a redundant HTTP dependency; errors, binary files, and SSE are centralized |
| Integration proof | H2/MockMvc tests | Optional Maven integration profile starts real pgvector PostgreSQL and proves Liquibase plus Hibernate validation |

## Gaps fixed during the audit

- The frontend test command previously failed because the repository contained no tests.
- The backend tests previously never started Spring, PostgreSQL, pgvector, or Liquibase.
- Practitioner endpoints were accidentally public for every HTTP method because `"GET"` was used
  as a path matcher instead of `HttpMethod.GET`.
- CORS accepted every localhost port and omitted PATCH and download response headers.
- Demo administrator creation ran in every environment.
- The default application configuration selected Ollama, contradicting the documented ability to
  run non-AI flows independently.
- The frontend stored generic `token` and `role` keys and cleared all origin storage on logout.
- The SSE parser only retained one `data:` line per event.
- PostgreSQL foreign-key access paths and document chunk uniqueness were not enforced by a
  forward migration.

## Deliberate differences

- Health Companion does not adopt Rider's H2 profile because H2 cannot validate the pgvector DDL
  and similarity operators used in production.
- The existing fetch client remains in place instead of adding Axios; centralization and typed
  errors provide the needed bootstrap boundary without shipping two HTTP stacks.
- Historical Liquibase files were not moved into Rider's `changes/` layout because a changelog
  path is part of an executed changeset's identity. Moving deployed history can cause checksum and
  duplicate-execution problems.
