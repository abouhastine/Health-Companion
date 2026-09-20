import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const easJson = JSON.parse(readFileSync(new URL('../eas.json', import.meta.url)));
const setupPlan = readFileSync(new URL('../../docs/mobile-app-setup-and-test-plan.md', import.meta.url), 'utf8');
const requiredScripts = ['start', 'android', 'ios', 'web', 'lint', 'typecheck', 'test', 'verify:contract'];
const requiredDependencies = ['expo-dev-client', 'react-dom', 'react-native-web', '@expo/metro-runtime'];
const requiredProfiles = ['development', 'preview', 'production'];

for (const script of requiredScripts) {
  if (!packageJson.scripts[script]) throw new Error(`Missing shared mobile script: ${script}`);
}
for (const dependency of requiredDependencies) {
  if (!packageJson.dependencies[dependency]) throw new Error(`Missing shared mobile dependency: ${dependency}`);
}
for (const profile of requiredProfiles) {
  if (!easJson.build[profile]) throw new Error(`Missing shared EAS build profile: ${profile}`);
}
for (const value of ['APP_ENV=local', 'EXPO_PUBLIC_API_BASE_URL', 'npm run web', 'npm run android', 'npm run ios', 'development', 'preview', 'production', '8080']) {
  if (!setupPlan.includes(value)) throw new Error(`Mobile setup plan is missing shared contract reference: ${value}`);
}
