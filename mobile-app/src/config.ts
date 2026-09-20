export type AppEnvironment = 'local' | 'preview' | 'production';

export function appEnvironment(environment: Record<string, string | undefined>): AppEnvironment {
  const value = environment.APP_ENV ?? 'production';
  if (value === 'local' || value === 'preview' || value === 'production') return value;
  throw new Error(`Unsupported APP_ENV: ${value}`);
}

export function apiBaseUrl(environment: Record<string, string | undefined>): string {
  const value = environment.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (!value) throw new Error('EXPO_PUBLIC_API_BASE_URL is required');
  if (appEnvironment(environment) !== 'local' && !value.startsWith('https://')) {
    throw new Error('HTTPS is required outside local development');
  }
  return value;
}
