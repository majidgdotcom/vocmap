import { fetchAuthSession } from 'aws-amplify/auth';

const TODO_API        = import.meta.env.VITE_API_TODO_URL        as string;
const KEYWORD_API     = import.meta.env.VITE_API_KEYWORD_URL     as string;
const WORD_FAMILY_API = import.meta.env.VITE_API_WORD_FAMILY_URL as string;
const VOCAB_API       = import.meta.env.VITE_API_VOCAB_URL       as string;

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ── Core fetchers ─────────────────────────────────────────────────────────────

/** Unwraps the `{ success, data }` envelope — returns `data` directly. */
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
  const body = await res.json();
  return body.data as T;
}

/** Returns the full envelope — used when `lastKey` lives at the top level. */
async function requestEnvelope<T>(
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
  return res.json() as Promise<T>;
}

// ── Error ─────────────────────────────────────────────────────────────────────

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

// ── Typed clients ─────────────────────────────────────────────────────────────

export const todoApi = {
  get:    <T>(path: string)                => request<T>(TODO_API, path),
  post:   <T>(path: string, body: unknown) => request<T>(TODO_API, path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(TODO_API, path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)                => request<T>(TODO_API, path, { method: 'DELETE' }),
};

export const keywordApi = {
  get:    <T>(path: string)                => request<T>(KEYWORD_API, path),
  post:   <T>(path: string, body: unknown) => request<T>(KEYWORD_API, path, { method: 'POST',   body: JSON.stringify(body) }),
  delete: <T>(path: string)                => request<T>(KEYWORD_API, path, { method: 'DELETE' }),
};

/** @vocmap/word-family-service — /word-families/* */
export const wordFamilyApi = {
  get:    <T>(path: string)                => request<T>(WORD_FAMILY_API, path),
  post:   <T>(path: string, body: unknown) => request<T>(WORD_FAMILY_API, path, { method: 'POST',   body: JSON.stringify(body) }),
  delete: <T>(path: string)                => request<T>(WORD_FAMILY_API, path, { method: 'DELETE' }),
};

/** Full-envelope variant for paginated word-family queries. */
export const wordFamilyApiRaw = {
  get: <T>(path: string) => requestEnvelope<T>(WORD_FAMILY_API, path),
};

/** @vocmap/vocabulary-service — /vocabulary/* */
export const vocabApi = {
  get:    <T>(path: string)                => request<T>(VOCAB_API, path),
  post:   <T>(path: string, body: unknown) => request<T>(VOCAB_API, path, { method: 'POST',   body: JSON.stringify(body) }),
  delete: <T>(path: string)                => request<T>(VOCAB_API, path, { method: 'DELETE' }),
};

/** Full-envelope variant for paginated vocabulary queries. */
export const vocabApiRaw = {
  get: <T>(path: string) => requestEnvelope<T>(VOCAB_API, path),
};
