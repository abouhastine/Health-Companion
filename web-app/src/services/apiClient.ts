import type { Chat } from '../types/domain';
import { token } from './session';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

async function errorMessage(response: Response) {
  const text = await response.text();
  if (!text) return `Request failed (${response.status})`;
  try {
    const body = JSON.parse(text) as { detail?: string; message?: string; title?: string };
    const message = body.detail ?? body.message ?? body.title ?? text;
    return message === 'Invalid request content.'
      ? 'Please check the required fields and try again.'
      : message;
  } catch {
    return text === 'Invalid request content.'
      ? 'Please check the required fields and try again.'
      : text;
  }
}

function downloadFilename(contentDisposition: string | null, fallback: string) {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  let filename = fallback;
  try {
    filename = encoded ? decodeURIComponent(encoded) : (plain ?? fallback);
  } catch {
    filename = plain ?? fallback;
  }
  filename = filename.replace(/[\\/:*?"<>|]/g, '_').trim() || 'medical-result';
  return filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
}

function authenticatedHeaders(headers?: HeadersInit): HeadersInit {
  const accessToken = token();
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers,
  };
}

export async function call<T>(path: string, options: RequestInit = {}): Promise<T> {
  const form = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: authenticatedHeaders({
      ...(!form ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export async function download(path: string, filename: string) {
  const response = await fetch(`${API_URL}${path}`, { headers: authenticatedHeaders() });
  if (!response.ok) throw new Error(await errorMessage(response));
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = downloadFilename(response.headers.get('Content-Disposition'), filename);
  link.click();
  URL.revokeObjectURL(url);
}

export async function preview(path: string) {
  const view = window.open('', '_blank');
  if (!view) throw new Error('Your browser blocked the document preview.');
  const response = await fetch(`${API_URL}${path}`, { headers: authenticatedHeaders() });
  if (!response.ok) {
    view.close();
    throw new Error(await errorMessage(response));
  }
  const url = URL.createObjectURL(await response.blob());
  view.location.href = url;
  view.addEventListener('beforeunload', () => URL.revokeObjectURL(url), { once: true });
}

function parseEvent(rawEvent: string) {
  const lines = rawEvent.split('\n');
  const name = lines
    .find((line) => line.startsWith('event:'))
    ?.slice(6)
    .trim();
  const data = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');
  return { name, data };
}

export async function streamChat(
  path: string,
  body: unknown,
  onToken: (chunk: string) => void,
): Promise<Chat> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: authenticatedHeaders({
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    }),
  });
  if (!response.ok || !response.body) throw new Error(await errorMessage(response));

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed: Chat | undefined;
  while (true) {
    const next = await reader.read();
    buffer += decoder.decode(next.value, { stream: !next.done }).replaceAll('\r\n', '\n');
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const rawEvent of events) {
      const event = parseEvent(rawEvent);
      if (event.name === 'token') onToken(event.data);
      if (event.name === 'complete') completed = JSON.parse(event.data) as Chat;
    }
    if (next.done) break;
  }
  if (!completed) throw new Error('The assistant stream ended unexpectedly.');
  return completed;
}
