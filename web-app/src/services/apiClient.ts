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
