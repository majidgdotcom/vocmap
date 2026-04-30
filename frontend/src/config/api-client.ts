import { fetchAuthSession } from 'aws-amplify/auth';

const TODO_API = import.meta.env.VITE_API_TODO_URL as string;
const KEYWORD_API = import.meta.env.VITE_API_KEYWORD_URL as string;

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, err.error ?? 'Request failed', err.code);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json();
  return data.data as T;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const todoApi = {
  get: <T>(path: string) => request<T>(TODO_API, path),
  post: <T>(path: string, body: unknown) =>
    request<T>(TODO_API, path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(TODO_API, path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(TODO_API, path, { method: 'DELETE' }),
};

export const keywordApi = {
  get: <T>(path: string) => request<T>(KEYWORD_API, path),
  post: <T>(path: string, body: unknown) =>
    request<T>(KEYWORD_API, path, { method: 'POST', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(KEYWORD_API, path, { method: 'DELETE' }),
};
