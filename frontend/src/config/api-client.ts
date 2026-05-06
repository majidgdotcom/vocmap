import { fetchAuthSession } from 'aws-amplify/auth';

const WORD_FAMILY_API = import.meta.env.VITE_API_WORD_FAMILY_URL as string;
const VOCAB_API       = import.meta.env.VITE_API_VOCAB_URL       as string;

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ── Core fetchers ─────────────────────────────────────────────────────────────

/** Authenticated — unwraps { success, data } envelope. */
async function request<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, err.error ?? 'Request failed', err.code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()).data as T;
}

/** Authenticated — returns full envelope (for paginated cursors). */
async function requestEnvelope<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, err.error ?? 'Request failed', err.code);
  }
  return res.json() as Promise<T>;
}

/** Unauthenticated — returns full envelope. Used for public vocabulary reads. */
async function publicEnvelope<T>(baseUrl: string, path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
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

/** word-family-service — authenticated */
export const wordFamilyApi = {
  get:    <T>(path: string)                => request<T>(WORD_FAMILY_API, path),
  post:   <T>(path: string, body: unknown) => request<T>(WORD_FAMILY_API, path, { method: 'POST',   body: JSON.stringify(body) }),
  delete: <T>(path: string)                => request<T>(WORD_FAMILY_API, path, { method: 'DELETE' }),
};

export const wordFamilyApiRaw = {
  get: <T>(path: string) => requestEnvelope<T>(WORD_FAMILY_API, path),
};

/** vocabulary-service — authenticated (for admin write operations) */
export const vocabApi = {
  get:    <T>(path: string)                => request<T>(VOCAB_API, path),
  post:   <T>(path: string, body: unknown) => request<T>(VOCAB_API, path, { method: 'POST',   body: JSON.stringify(body) }),
  delete: <T>(path: string)                => request<T>(VOCAB_API, path, { method: 'DELETE' }),
};

export const vocabApiRaw = {
  get: <T>(path: string) => requestEnvelope<T>(VOCAB_API, path),
};

/**
 * vocabulary-service — NO authentication.
 * Used for public vocabulary reads (search + word lookup).
 */
export const publicVocabApiRaw = {
  get: <T>(path: string) => publicEnvelope<T>(VOCAB_API, path),
};
