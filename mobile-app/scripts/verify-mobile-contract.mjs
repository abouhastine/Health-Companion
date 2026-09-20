import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const easJson = JSON.parse(readFileSync(new URL('../eas.json', import.meta.url)));
const requiredScripts = ['start', 'android', 'ios', 'web', 'lint', 'typecheck', 'test'];
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
