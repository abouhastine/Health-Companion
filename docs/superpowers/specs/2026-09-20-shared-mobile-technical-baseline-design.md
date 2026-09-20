# Shared Mobile Technical Baseline

## Goal

Health Companion and Rider Companion keep independent product domains and API paths, while sharing
the same Expo SDK 52 development, transport, session, build, and test conventions. The baseline
makes local HTTP testing explicit and safe for development builds, while requiring HTTPS for cloud
preview and production builds.

## Scope

This baseline applies to each repository's React Native/Expo client and its Spring backend's CORS
configuration. It does not merge repositories, alter business endpoints, change the products'
screens, or require equal backend ports. Health continues on port 8080 and Rider on port 8081 so
both systems can run concurrently.

## Environment contract

Both applications use one variable:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://localhost:<backend-port>
```

for local development and an HTTPS origin for preview and production. The value is supplied via
ignored local environment files or EAS build environment variables; it is never a production
fallback embedded in `app.json`.

Each client uses an `APP_ENV` build mode:

- `local`: permits HTTP transport exclusively in a development build.
- `preview` and `production`: require an `https://` API URL and contain no HTTP transport
  exceptions.

An Expo dynamic config applies Android cleartext traffic and iOS ATS exceptions only for `local`.
This is necessary because native network policy otherwise rejects HTTP even when JavaScript has a
local API URL. Browser mode does not use those native exceptions.

## Shared development and release profiles

Each client exposes the same EAS profile names:

- `development`: an internal development client for local HTTP, emulator, simulator, and native
  capability testing.
- `preview`: an internal HTTPS-only distribution build.
- `production`: an HTTPS-only store build.

`expo-dev-client` is included in both clients. Expo Go is limited to quick UI smoke tests; it is
not evidence for the native transport or biometric/SecureStore path.

## API and session conventions

Both clients centralize API base URL validation and request construction. They trim trailing
slashes, reject a missing URL, accept HTTP only in `local`, and reject non-HTTPS URLs outside that
mode.

The access token remains in memory. Only the refresh token is persisted in SecureStore with
authentication required. Re-entry retrieves the refresh token through SecureStore's protected
read, then rotates it through the existing mobile-refresh endpoint. Local authentication is not a
separate precondition that can bypass or conflict with SecureStore's device-authentication path.
Sign-out attempts server revocation and always removes local credentials.

## Browser and CORS conventions

Both apps declare Expo Web dependencies and provide a `web` script. Browser smoke tests run on a
documented non-conflicting port. Each backend reads allowed CORS origins from configuration rather
than hard-coding one client origin. Local configuration permits the relevant Expo Web origin;
deployed environments restrict it to their known web client origins.

## Quality and test baseline

Both clients provide `lint`, `typecheck`, and `test` scripts. Shared automated coverage includes
API URL validation, authenticated requests, HTTP error mapping, session persistence/refresh/
sign-out, and transport-mode behavior. Each product retains domain-specific CRUD and UI tests.

Manual tests use the same matrix: browser smoke test; Android emulator; iOS Simulator; and
physical Android/iOS devices. Native local testing uses the local development build; preview and
production validation use an HTTPS API. Setup and test-plan documents in both repositories state
these rules identically, with only project names, ports, and domain scenarios differing.
