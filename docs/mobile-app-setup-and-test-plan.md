# Mobile app setup and test plan

This plan is the local-testing counterpart to the mobile beta specification. It uses the same
environment contract as Rider Companion: HTTP is allowed only with `APP_ENV=local`; preview and
production use HTTPS only.

## Prerequisites

- Node.js and npm; Java 21 for the API; Docker for the documented demo stack.
- Android Studio with an emulator, and/or Xcode with an iOS Simulator on macOS.
- A physical device is optional. Expo Go is suitable only for UI smoke checks; local native HTTP
  needs an EAS `development` client because the development-only network policy is built into the
  native app.

## Local setup

Start the local API on port 8080 from the repository root. This example uses the local Ollama
profile; use `demo,openai` only after supplying its required key:

```bash
cp .env.example .env
docker compose up -d --wait
cd backend
set -a && source ../.env && set +a
SPRING_PROFILES_ACTIVE=demo,local-ai ./mvnw spring-boot:run
```

In another terminal:

```bash
cd mobile-app
cp .env.example .env
npm ci
npm run web
```

The sample environment is:

```dotenv
APP_ENV=local
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

Expo Web runs on `http://localhost:19006`; the backend CORS defaults include that origin. Do not
use a tunnel as a substitute for API reachability: it exposes Metro only.

## Emulator, simulator, and device

For an emulator or simulator, retain the localhost URL and run one of:

```bash
cd mobile-app
npm run android
npm run ios
```

First create and install the native development client when required:

```bash
npx eas build --profile development --platform android
npx eas build --profile development --platform ios
```

For a physical device on the same Wi-Fi, replace `localhost` in `.env` with the development
machine's LAN address, for example `http://192.168.1.42:8080`, restart Expo, and use the installed
development client. Confirm the device can open the API host before testing.

For an internal or store build, set `APP_ENV=preview` or `APP_ENV=production` and an HTTPS
`EXPO_PUBLIC_API_BASE_URL` in EAS environment configuration, then build with `preview` or
`production`. HTTP values are rejected outside local development.

## Automated checks

```bash
cd mobile-app
npm run lint
npm test
npm run typecheck
npm run verify:contract

cd ../backend
./mvnw test
```

## Manual test matrix

Run core navigation and form checks in Expo Web, then repeat native-only behavior on Android and
iOS development clients.

- Authentication: registration, invalid credentials, biometric/passcode accept and cancel, refresh,
  expired or revoked refresh token, and sign-out. After sign-out, including an authentication-prompt
  cancellation, reopening must show sign-in.
- Patient workflow: practitioner discovery, booking, rescheduling, cancellation, appointment
  history, results/PDF authorization, general and result-scoped AI safety/error responses, and
  profile updates/account-deletion eligibility.
- Resilience: offline/API-unavailable, 401, 403, 404, validation errors, and app restart.
- Native behavior: protected SecureStore persistence, biometric/passcode prompt, PDF rendering,
  safe-area/back behavior, keyboard handling, dynamic text, screen-reader labels, focus order, and
  portrait layout on both platforms.
- Release: repeat the smoke flow on HTTPS-only `preview`, then use only synthetic/anonymized data
  for TestFlight or Play internal distribution validation.
