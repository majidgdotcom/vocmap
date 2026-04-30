/**
 * Integration tests — runs against a deployed environment.
 *
 * Required env vars:
 *   TODO_API_URL, KEYWORD_API_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD
 *
 * Run: yarn test:integration
 */

import { signIn } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

// Configure Amplify with env vars injected by CI
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.VITE_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.VITE_COGNITO_CLIENT_ID!,
    },
  },
});

const TODO_API = process.env.TODO_API_URL!;
const KEYWORD_API = process.env.KEYWORD_API_URL!;

let idToken: string;
let createdTodoId: string;
let createdKeywordId: string;

async function authedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      ...options.headers,
    },
  });
}

beforeAll(async () => {
  const result = await signIn({
    username: process.env.TEST_USER_EMAIL!,
    password: process.env.TEST_USER_PASSWORD!,
  });
  // In real test env, extract token after successful sign-in
  // idToken = result.tokens?.idToken?.toString()!;
  // Placeholder for structure
  idToken = 'test-token';
}, 30_000);

describe('Todo CRUD integration', () => {
  it('POST /todos — creates a todo', async () => {
    const res = await authedFetch(`${TODO_API}/todos`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Integration test todo', description: 'Created by CI' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Integration test todo');
    createdTodoId = body.data.todoId;
  });

  it('GET /todos — lists todos for user', async () => {
    const res = await authedFetch(`${TODO_API}/todos`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  it('GET /todos/:id — retrieves the created todo', async () => {
    const res = await authedFetch(`${TODO_API}/todos/${createdTodoId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.todoId).toBe(createdTodoId);
  });

  it('PUT /todos/:id — updates the todo', async () => {
    const res = await authedFetch(`${TODO_API}/todos/${createdTodoId}`, {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated title' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.title).toBe('Updated title');
  });
});

describe('Keyword integration', () => {
  it('POST /todos/:id/keywords — adds keywords', async () => {
    const res = await authedFetch(`${KEYWORD_API}/todos/${createdTodoId}/keywords`, {
      method: 'POST',
      body: JSON.stringify({
        keywords: [
          { label: 'ci-test', color: '#6366f1' },
          { label: 'integration' },
        ],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    createdKeywordId = body.data[0].keywordId;
  });

  it('GET /todos/:id/keywords — lists keywords', async () => {
    const res = await authedFetch(`${KEYWORD_API}/todos/${createdTodoId}/keywords`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('DELETE /todos/:id/keywords/:kwId — deletes a keyword', async () => {
    const res = await authedFetch(
      `${KEYWORD_API}/todos/${createdTodoId}/keywords/${createdKeywordId}`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(204);
  });
});

describe('Archive + cleanup', () => {
  it('POST /todos/:id/archive — archives the todo', async () => {
    const res = await authedFetch(`${TODO_API}/todos/${createdTodoId}/archive`, {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('ARCHIVED');
  });

  it('DELETE /todos/:id — deletes the test todo', async () => {
    const res = await authedFetch(`${TODO_API}/todos/${createdTodoId}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });
});
