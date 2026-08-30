# Health Companion Web App

React 18 and strict TypeScript application built with Vite, Material UI, React Router, TanStack
Query, React Hook Form, and Zod.

## Commands

```bash
cp .env.example .env
npm ci
npm run dev
npm run format:check
npm run lint
npm test
npm run coverage
npm run build
```

`VITE_API_URL` controls the API origin and defaults to `http://localhost:8080`.

## Structure

- `src/app` contains the application, providers, and MUI theme.
- `src/features` owns the page modules, schemas, and tests for each product feature.
- `src/layouts` and `src/components` contain shared application chrome and small reusable UI.
- `src/routes` contains access guards and composes feature pages into URLs; page behavior stays in
  the corresponding feature module.
- `src/services` is the HTTP, streaming, download, and versioned-session boundary.
- `src/types` contains API/domain contracts.
- `src/test` owns shared Vitest and React Testing Library setup.

The API client normalizes Spring Problem Details responses and supports multiline server-sent
events. Authentication fields use React Hook Form with Zod validation. TanStack Query is wired at
the application boundary for incremental migration of server-state calls.
