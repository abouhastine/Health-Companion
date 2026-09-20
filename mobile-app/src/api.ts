import type { Chat, MobileAuth } from './domain';
import { apiBaseUrl } from './config';

const baseUrl = () => apiBaseUrl(process.env);

let accessToken: string | undefined;
export const setAccessToken = (value?: string) => { accessToken = value; };

async function error(response: Response) {
  const body = await response.text();
  try { return (JSON.parse(body).detail ?? JSON.parse(body).message ?? body) as string; } catch { return body || `Request failed (${response.status})`; }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init.headers },
  });
  if (!response.ok) throw new Error(await error(response));
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export const mobileLogin = (body: object) => api<MobileAuth>('/api/auth/mobile/login', { method: 'POST', body: JSON.stringify(body) });
export const mobileRegister = (body: object) => api<MobileAuth>('/api/auth/mobile/register', { method: 'POST', body: JSON.stringify(body) });
export const mobileRefresh = (refreshToken: string) => api<MobileAuth['session']>('/api/auth/mobile/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
export const mobileLogout = (refreshToken: string) => api<void>('/api/auth/mobile/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) });

export function documentRequest(id: number) {
  if (!accessToken) throw new Error('Please sign in again.');
  return { uri: `${baseUrl()}/api/documents/${id}/download`, headers: { Authorization: `Bearer ${accessToken}` } };
}

export async function streamDocumentChat(path: string, body: object, onToken: (token: string) => void): Promise<Chat> {
  const response = await fetch(`${baseUrl()}${path}`, { method: 'POST', body: JSON.stringify(body), headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' } });
  if (!response.ok || !response.body) throw new Error(await error(response));
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = ''; let completed: Chat | undefined;
  for (;;) {
    const next = await reader.read(); buffer += decoder.decode(next.value, { stream: !next.done }).replace(/\r\n/g, '\n');
    const events = buffer.split('\n\n'); buffer = events.pop() ?? '';
    for (const raw of events) {
      const event = raw.match(/^event:\s*(.+)$/m)?.[1]; const data = raw.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
      if (event === 'token') onToken(data); if (event === 'complete') completed = JSON.parse(data) as Chat;
    }
    if (next.done) break;
  }
  if (!completed) throw new Error('The assistant stream ended unexpectedly.');
  return completed;
}
