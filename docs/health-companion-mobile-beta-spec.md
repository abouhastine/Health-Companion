# Health Companion — Mobile Beta Specification

## Purpose and boundary

The mobile beta is a patient-only companion to the implemented web demo. It ships native iOS and
Android binaries from one React Native/Expo codebase. It reuses the Spring Boot API and does not
replace or broaden the completed web-demo contract.

The beta is distributed privately through TestFlight and Google Play internal testing. It uses only
synthetic or appropriately anonymized accounts, documents, and AI prompts against an HTTPS-reachable
demo environment. It is not approved for real patient data or public-store production use.

## Delivered patient experience

- Email/password registration and sign-in, followed by biometric or device-passcode protected
  re-entry.
- Dashboard, practitioner discovery and details, appointment booking, rescheduling, cancellation,
  and appointment history.
- Medical-result list/detail, authenticated in-app PDF viewing, general health-assistant chat, and
  streamed **Ask About This Result** chat.
- Profile update, eligible account deletion, and sign-out.

The primary tabs are Home, Find care, Appointments, Results, and Assistant; Profile is in the
settings flow. The beta is English-only and online-only. It has no admin workspace, push
notifications, offline cache, patient camera/file upload, OTP, French/Arabic/RTL experience, or
local persistence of documents, chats, or profile data.

## Architecture and security

`mobile-app/` uses Expo, React Native, Expo Router, React Query, TypeScript, EAS Build,
`expo-secure-store`, and `expo-local-authentication`. Mobile UI is native; it does not reuse web
MUI components. Shared REST DTO concepts and endpoints remain aligned with the web client.

The existing `/api/auth/register` and `/api/auth/login` endpoints remain browser-compatible.
Mobile uses `/api/auth/mobile/register`, `/login`, `/refresh`, and `/logout` instead. Login and
registration return a 15-minute access JWT and an opaque refresh token. The server stores only a
SHA-256 hash of the refresh token in `mobile_sessions`, along with the patient, platform, device
label, expiry, creation timestamp, and revocation timestamp. Refresh rotates and revokes the prior
token; logout revokes the supplied session.

The application keeps the access token in memory only. Its refresh token is held in Keychain or
Android Keystore through SecureStore with system authentication enabled. App re-entry refreshes an
access token only after biometric/device-passcode authentication. Failure, expiry, revocation, or
logout clears local credentials and returns the user to sign-in.

PDF viewing uses an authenticated WebView request and is not saved as an offline document. The
document SSE endpoint is used for progressive, document-scoped explanations; general chat uses the
existing non-streaming endpoint. Existing authorization and AI safety responses remain mandatory.

## Configuration and release

Copy `mobile-app/.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the HTTPS demo API. Do
not put API keys, JWT secrets, or real-health-data endpoints in the Expo client. Final bundle IDs,
signing credentials, store accounts, and crash-reporting configuration are release inputs and must
be supplied outside source control.

Use `npm ci`, `npm run start`, `npm run ios`, or `npm run android` during development. Use the EAS
`preview` profile for TestFlight and Google Play internal-test artifacts. The build must not be
promoted to public stores until product, security, privacy, operational, and regulatory readiness
have been separately approved.

## Acceptance criteria

- Backend tests cover mobile login/registration, refresh rotation, revoked/expired/replayed tokens,
  logout, and patient ownership isolation.
- iOS and Android tests cover sign-in, biometric unlock, booking/rescheduling/cancellation,
  authorized PDF access, AI safety responses, session expiry, and network failures.
- Accessibility validation covers screen-reader labels, dynamic text, contrast, focus order, and
  platform back navigation.
- TestFlight and Google Play internal builds successfully reach the HTTPS demo environment using
  synthetic/anonymized test records only.
