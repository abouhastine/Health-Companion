import type { Auth } from '../types/domain';

const SESSION_KEY = 'health-companion.session.v1';

function session(): Auth | undefined {
  const value = window.localStorage.getItem(SESSION_KEY);
  if (value) {
    try {
      return JSON.parse(value) as Auth;
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }

  const legacyToken = window.localStorage.getItem('token');
  const legacyRole = window.localStorage.getItem('role');
  return legacyToken && legacyRole ? { token: legacyToken, role: legacyRole } : undefined;
}

export const token = () => session()?.token ?? null;
export const role = () => session()?.role ?? null;

export function remember(auth: Auth) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(auth));
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('role');
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('role');
}
