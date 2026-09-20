# Shared Mobile Technical Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Health Companion and Rider Companion use the same Expo 52 local-development, HTTPS-release, session, browser, CORS, quality-gate, and setup/test conventions.

**Architecture:** Both clients receive a small environment module that validates one `EXPO_PUBLIC_API_BASE_URL` contract and reads `APP_ENV`. Dynamic Expo configuration enables native HTTP only for local development builds. Each backend exposes allowed CORS origins as configuration, while client sessions persist only a protected refresh token and keep access tokens in memory.

**Tech Stack:** Expo SDK 52, React Native, Expo Router, Expo SecureStore, EAS Build, TypeScript, Jest, Spring Boot, Spring Security CORS.

**Spec:** `docs/superpowers/specs/2026-09-20-shared-mobile-technical-baseline-design.md`

## Global Constraints

- Health Companion continues to use backend port 8080; Rider Companion continues to use port 8081.
- Both clients use `EXPO_PUBLIC_API_BASE_URL`; do not preserve an `app.json` API fallback.
- `APP_ENV=local` is the only mode that accepts an `http://` API URL and native cleartext exceptions.
- `APP_ENV=preview` and `APP_ENV=production` require an `https://` API URL and contain no cleartext exceptions.
- Access tokens remain memory-only; only refresh tokens may enter SecureStore, with authentication required.
- Domain screens, DTOs, API paths, and product-specific backend behavior remain unchanged.
- Both clients provide `lint`, `typecheck`, `test`, `web`, `start`, `android`, and `ios` scripts.

## Review Focus

- A missing API URL must fail clearly before a request is made; test this in each API configuration module.
- An HTTP API URL outside `local` must fail rather than merely log a warning; test both preview and production modes.
- A trailing slash in a valid API URL must not yield double slashes in authenticated requests; test the generated request URL.
- Cancelling device authentication or invalidating the SecureStore entry must leave the user signed out; test each session provider.
- CORS must allow the configured Expo Web origin and reject unrelated origins; test both Spring CORS configuration sources.

---

### Task 1: Align Expo dependencies, scripts, and EAS profiles

**Files:**
- Modify: `Health-Companion/mobile-app/package.json`
- Modify: `Health-Companion/mobile-app/package-lock.json`
- Modify: `Health-Companion/mobile-app/eas.json`
- Modify: `Rider-Companion/mobile-app/package.json`
- Modify: `Rider-Companion/mobile-app/package-lock.json`
- Modify: `Rider-Companion/mobile-app/eas.json`

**Interfaces:**
- Produces: identical script names and EAS profile semantics used by Tasks 2–6.

- [ ] **Step 1: Add failing package-contract tests**

Create `mobile-app/scripts/verify-mobile-contract.mjs` in each repository. It must parse the local `package.json` and `eas.json` and throw unless `lint`, `typecheck`, `test`, `web`, `start`, `android`, and `ios` scripts exist; `expo-dev-client`, `react-dom`, `react-native-web`, and `@expo/metro-runtime` are dependencies; and `development`, `preview`, and `production` EAS profiles exist.

```js
if (!requiredScripts.every((name) => packageJson.scripts[name])) {
  throw new Error('Missing shared mobile script');
}
if (!requiredDependencies.every((name) => packageJson.dependencies[name])) {
  throw new Error('Missing shared mobile dependency');
}
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `node scripts/verify-mobile-contract.mjs`

Expected: FAIL because one or both clients lack the common scripts, dependencies, or EAS profiles.

- [ ] **Step 3: Install Expo-compatible dependencies and align scripts**

Run in each `mobile-app/` directory:

```bash
npx expo install expo-dev-client react-dom react-native-web @expo/metro-runtime
```

Use `npx expo install --fix` in Rider to align all SDK 52-managed packages. Add:

```json
"lint": "eslint . --max-warnings 0",
"web": "expo start --web --port 19006"
```

to Health, and the same scripts to Rider except Rider uses port `19007`. Add Expo ESLint packages to Rider using `npx expo install eslint eslint-config-expo`, then add `eslint.config.js` equivalent to Health's Expo ESLint configuration.

Set both `eas.json` files to:

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal", "env": { "APP_ENV": "local" } },
    "preview": { "distribution": "internal", "env": { "APP_ENV": "preview" } },
    "production": { "env": { "APP_ENV": "production" } }
  }
}
```

- [ ] **Step 4: Run compatibility and package-contract checks**

Run: `npx expo install --check && node scripts/verify-mobile-contract.mjs`

Expected: Expo reports no incompatible SDK-managed packages and both contract checks PASS.

- [ ] **Step 5: Commit the aligned toolchain**

```bash
git add mobile-app/package.json mobile-app/package-lock.json mobile-app/eas.json mobile-app/eslint.config.js mobile-app/scripts/verify-mobile-contract.mjs
git commit -m "align mobile Expo toolchain"
```

### Task 2: Add shared local/preview/production API configuration

**Files:**
- Create: `Health-Companion/mobile-app/src/config.ts`
- Modify: `Health-Companion/mobile-app/src/api.ts`
- Create: `Health-Companion/mobile-app/src/config.test.ts`
- Create: `Rider-Companion/mobile-app/src/config.ts`
- Modify: `Rider-Companion/mobile-app/src/api.ts`
- Create: `Rider-Companion/mobile-app/src/config.test.ts`
- Modify: both `mobile-app/.env.example`

**Interfaces:**
- Produces: `apiBaseUrl(environment: Record<string, string | undefined>): string` and `appEnvironment(environment): 'local' | 'preview' | 'production'`.
- Consumes: `EXPO_PUBLIC_API_BASE_URL` and `APP_ENV`.

- [ ] **Step 1: Write failing API-config tests in both clients**

```ts
expect(() => apiBaseUrl({ APP_ENV: 'preview', EXPO_PUBLIC_API_BASE_URL: 'http://localhost:8080' }))
  .toThrow('HTTPS is required outside local development');
expect(apiBaseUrl({ APP_ENV: 'local', EXPO_PUBLIC_API_BASE_URL: 'http://localhost:8080/' }))
  .toBe('http://localhost:8080');
expect(() => apiBaseUrl({ APP_ENV: 'local' })).toThrow('EXPO_PUBLIC_API_BASE_URL is required');
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm test -- config.test.ts`

Expected: FAIL because `config.ts` does not yet exist.

- [ ] **Step 3: Implement the common configuration module and consume it**

```ts
export function apiBaseUrl(environment: Record<string, string | undefined>) {
  const value = environment.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  const mode = appEnvironment(environment);
  if (!value) throw new Error('EXPO_PUBLIC_API_BASE_URL is required');
  if (mode !== 'local' && !value.startsWith('https://')) {
    throw new Error('HTTPS is required outside local development');
  }
  return value;
}
```

Replace Health's `EXPO_PUBLIC_API_URL` lookup and Rider's `Constants.expoConfig.extra.apiBaseUrl` fallback. Update both `.env.example` files to show `APP_ENV=local` and their local backend URL.

- [ ] **Step 4: Run configuration, API, and type checks**

Run: `npm test && npm run typecheck`

Expected: PASS in each mobile app.

- [ ] **Step 5: Commit the configuration contract**

```bash
git add mobile-app/src/config.ts mobile-app/src/config.test.ts mobile-app/src/api.ts mobile-app/.env.example
git commit -m "standardize mobile API configuration"
```

### Task 3: Apply development-only native HTTP configuration

**Files:**
- Create: `Health-Companion/mobile-app/app.config.ts`
- Delete: `Health-Companion/mobile-app/app.json`
- Create: `Rider-Companion/mobile-app/app.config.ts`
- Delete: `Rider-Companion/mobile-app/app.json`
- Test: both `mobile-app/scripts/verify-mobile-contract.mjs`

**Interfaces:**
- Consumes: `APP_ENV` at Expo config evaluation.
- Produces: `android.usesCleartextTraffic === true` and iOS ATS exception only when `APP_ENV === 'local'`.

- [ ] **Step 1: Add failing config-contract cases**

Extend each contract script to execute `npx expo config --json` with `APP_ENV=local` and `APP_ENV=preview`. Assert local configuration has `android.usesCleartextTraffic === true` and `ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads === true`, while preview has neither value.

- [ ] **Step 2: Run the contract script and verify it fails**

Run: `node scripts/verify-mobile-contract.mjs`

Expected: FAIL because static `app.json` cannot conditionally expose the native transport settings.

- [ ] **Step 3: Replace static configuration with a dynamic Expo config**

Define a typed `ExpoConfig` preserving each application's identity, permissions, router, typed-route, and visual settings. Add only this conditional block for local:

```ts
const local = process.env.APP_ENV === 'local';
android: { ...android, usesCleartextTraffic: local || undefined },
ios: {
  ...ios,
  infoPlist: local ? { NSAppTransportSecurity: { NSAllowsArbitraryLoads: true } } : undefined,
}
```

Retain Rider's Face ID and Image Picker permissions and Health's document-related settings. Do not add HTTP exceptions to preview or production.

- [ ] **Step 4: Verify resolved configs**

Run: `APP_ENV=local npx expo config --json` and `APP_ENV=preview npx expo config --json` in each client.

Expected: only local output contains the cleartext/ATS settings.

- [ ] **Step 5: Commit native transport configuration**

```bash
git add mobile-app/app.config.ts mobile-app/app.json mobile-app/scripts/verify-mobile-contract.mjs
git commit -m "allow HTTP only in local mobile builds"
```

### Task 4: Standardize protected refresh-token sessions

**Files:**
- Modify: `Health-Companion/mobile-app/src/session.tsx`
- Create: `Health-Companion/mobile-app/src/session.test.tsx`
- Modify: `Rider-Companion/mobile-app/src/session.tsx`
- Modify: `Rider-Companion/mobile-app/src/session.test.ts`

**Interfaces:**
- Consumes: `SecureStore.getItemAsync`, `SecureStore.setItemAsync`, `mobileRefresh`, and `mobileLogout`.
- Produces: a signed-in state only after a protected refresh-token retrieval and successful refresh.

- [ ] **Step 1: Write failing session tests**

Mock SecureStore and the mobile auth API. Test that storage receives only the refresh token with `requireAuthentication: true`, that an authentication/read failure leaves the provider signed out, that refresh rotation overwrites the prior token, and that sign-out clears storage even when logout rejects.

```ts
expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
  expect.any(String),
  'rotated-refresh-token',
  expect.objectContaining({ requireAuthentication: true }),
);
expect(setAccessToken).toHaveBeenLastCalledWith(undefined);
```

- [ ] **Step 2: Run the session tests and verify they fail**

Run: `npm test -- session.test`

Expected: Rider fails because it stores the full session without authentication protection; Health lacks the requested test behavior.

- [ ] **Step 3: Implement common session semantics**

Remove Rider's persisted `MobileSession` and separate `LocalAuthentication` prompt. In both clients, persist just `refreshToken` with `requireAuthentication: true`; on startup retrieve it with the protected SecureStore API, call refresh, persist the rotated refresh token, set only the returned access token in memory, and clear both state and access token after errors. Retain best-effort server logout followed by unconditional local deletion.

- [ ] **Step 4: Run mobile test suites, type checks, and lint**

Run: `npm run lint && npm test && npm run typecheck`

Expected: PASS in each client.

- [ ] **Step 5: Commit session alignment**

```bash
git add mobile-app/src/session.tsx mobile-app/src/session.test.ts mobile-app/src/session.test.tsx
git commit -m "align protected mobile sessions"
```

### Task 5: Externalize backend CORS for Expo Web

**Files:**
- Modify: `Health-Companion/.env.example`
- Modify: `Health-Companion/backend/src/main/resources/application.yml`
- Modify: `Health-Companion/backend/src/test/java/.../SecurityConfigTest.java`
- Modify: `Rider-Companion/backend/rider-companion/src/main/resources/application.properties`
- Modify: `Rider-Companion/backend/rider-companion/src/main/java/com/rider/companion/config/SecurityConfig.java`
- Create: `Rider-Companion/backend/rider-companion/src/test/java/com/rider/companion/config/SecurityConfigTest.java`

**Interfaces:**
- Consumes: comma-separated `CORS_ALLOWED_ORIGINS` / `app.cors.allowed-origins` configuration.
- Produces: CORS configuration permitting the configured Expo Web origin and preserving Authorization and Content-Type request headers.

- [ ] **Step 1: Write failing Rider CORS tests**

Instantiate the Rider `CorsConfigurationSource` with `http://localhost:19007` and assert it permits that origin, `Authorization`, and `PATCH`. Assert an unrelated origin is not allowed. Add Health coverage for its local origin list including `http://localhost:19006`.

- [ ] **Step 2: Run targeted tests and verify failure**

Run: `./mvnw test -Dtest=SecurityConfigTest`

Expected: Rider fails because its allowed origin is hard-coded to port 5173; Health fails until its test fixture/config includes port 19006.

- [ ] **Step 3: Implement configuration-driven CORS**

In Rider, inject `@Value("${app.cors.allowed-origins}") List<String> allowedOrigins` in the CORS bean, matching Health's approach. Define Rider's property with `CORS_ALLOWED_ORIGINS` defaulting to `http://localhost:19007`. Set Health defaults/examples to include its documented Expo Web origin `http://localhost:19006` in addition to the Vite origins.

- [ ] **Step 4: Run backend tests**

Run: `./mvnw test`

Expected: PASS in each backend.

- [ ] **Step 5: Commit the CORS alignment**

```bash
git add backend/src/main .env.example
git commit -m "configure mobile web CORS origins"
```

### Task 6: Align setup documents and verify the complete matrix

**Files:**
- Modify: `Health-Companion/README.md`
- Modify: `Health-Companion/docs/health-companion-mobile-beta-spec.md`
- Create: `Health-Companion/docs/mobile-app-setup-and-test-plan.md`
- Modify: `Rider-Companion/README.md`
- Modify: `Rider-Companion/docs/mobile-app-setup-and-test-plan.md`
- Modify: `Rider-Companion/docs/specs/rider-companion-mobile-beta-spec.md`

**Interfaces:**
- Consumes: scripts and environment contract from Tasks 1–5.
- Produces: parallel local browser, emulator, simulator, physical-device, preview, and production instructions.

- [ ] **Step 1: Add documentation acceptance checks to each contract script**

Make each script read its setup plan and require the literal references to `APP_ENV=local`, `EXPO_PUBLIC_API_BASE_URL`, `npm run web`, `npm run android`, `npm run ios`, `development`, `preview`, `production`, and the project's backend port.

- [ ] **Step 2: Run the checks and verify they fail**

Run: `node mobile-app/scripts/verify-mobile-contract.mjs`

Expected: FAIL until both setup plans explain every common path.

- [ ] **Step 3: Update both setup/test plans**

Document this identical workflow, substituting port and product-domain test scenarios only:

```bash
# Browser against local backend
APP_ENV=local EXPO_PUBLIC_API_BASE_URL=http://localhost:<port> npm run web

# Native local development build
eas build --profile development --platform ios
eas build --profile development --platform android

# HTTPS-only internal and store builds
eas build --profile preview --platform all
eas build --profile production --platform all
```

State that Expo Go is UI-only smoke testing; local native HTTP requires a development build; browser requires the configured Expo Web CORS origin; preview/production require an HTTPS deployment; and physical local HTTP uses the machine's LAN IP rather than `localhost`.

- [ ] **Step 4: Execute every automated gate**

Run in each mobile app: `npm run lint && npm test && npm run typecheck && node scripts/verify-mobile-contract.mjs`.

Run in each backend: `./mvnw test`.

Expected: all commands PASS.

- [ ] **Step 5: Perform manual smoke checks**

Verify Expo Web loads on ports 19006 and 19007 against its matching local backend; verify resolved local and preview Expo configs; then install one local development build per platform and confirm HTTP access on emulator/simulator. Record that physical-device testing uses the LAN IP and the local development build.

- [ ] **Step 6: Commit documentation and verification contracts**

```bash
git add README.md docs mobile-app/scripts/verify-mobile-contract.mjs
git commit -m "document aligned mobile test setup"
```
