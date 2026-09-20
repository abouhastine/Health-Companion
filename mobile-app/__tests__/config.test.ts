import { apiBaseUrl } from '../src/config';

describe('mobile API configuration', () => {
  it('rejects HTTP outside local development', () => {
    expect(() => apiBaseUrl({ APP_ENV: 'preview', EXPO_PUBLIC_API_BASE_URL: 'http://localhost:8080' })).toThrow(
      'HTTPS is required outside local development',
    );
  });

  it('accepts and normalizes a local HTTP URL', () => {
    expect(apiBaseUrl({ APP_ENV: 'local', EXPO_PUBLIC_API_BASE_URL: 'http://localhost:8080/' })).toBe('http://localhost:8080');
  });

  it('rejects a missing API URL', () => {
    expect(() => apiBaseUrl({ APP_ENV: 'local' })).toThrow('EXPO_PUBLIC_API_BASE_URL is required');
  });
});
