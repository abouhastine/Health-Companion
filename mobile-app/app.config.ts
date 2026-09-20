import type { ExpoConfig } from 'expo/config';

const local = process.env.APP_ENV === 'local';

const config: ExpoConfig = {
  name: 'Health Companion Beta',
  slug: 'health-companion-mobile',
  scheme: 'healthcompanion',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.healthcompanion.mobile',
    infoPlist: local ? { NSAppTransportSecurity: { NSAllowsArbitraryLoads: true } } : undefined,
  },
  android: { package: 'com.healthcompanion.mobile', usesCleartextTraffic: local || undefined },
  plugins: [
    'expo-router',
    ['expo-secure-store', { faceIDPermission: 'Use Face ID to unlock Health Companion.' }],
    ['expo-local-authentication', { faceIDPermission: 'Use Face ID to unlock Health Companion.' }],
  ],
  experiments: { typedRoutes: true },
};

export default config;
