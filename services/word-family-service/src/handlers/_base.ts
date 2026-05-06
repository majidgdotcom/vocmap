import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ZodError } from 'zod';
import { WordFamilyNotFoundError } from '../application/word-family.use-cases';

type HandlerFn = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export function withErrorHandling(fn: HandlerFn): HandlerFn {
  return async (event) => {
    try {
      return await fn(event);
    } catch (err) {
      if (err instanceof ZodError) {
        return response(400, { success: false, error: 'Validation error', code: 'VALIDATION_ERROR', details: err.flatten().fieldErrors });
      }
      if (err instanceof WordFamilyNotFoundError) {
        return response(404, { success: false, error: err.message, code: 'NOT_FOUND' });
      }
      if (err instanceof Error && err.message.startsWith('FORBIDDEN')) {
        return response(403, { success: false, error: err.message, code: 'FORBIDDEN' });
      }
      console.error('Unhandled error:', err);
      return response(500, { success: false, error: 'Internal server error', code: 'INTERNAL' });
    }
  };
}

export function response(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(body),
  };
}

export function getUserId(event: APIGatewayProxyEvent): string {
  const userId = event.requestContext.authorizer?.claims?.sub;
  if (!userId) throw new Error('FORBIDDEN: missing userId in JWT claims');
  return userId as string;
}

/**
 * Reads cognito:groups from the JWT claims and throws FORBIDDEN
 * if the caller is not a member of the "admin" group.
 *
 * Usage — call at the top of every handler that must be admin-only:
 *   assertAdmin(event);
 *   const userId = getUserId(event);
 */
export function assertAdmin(event: APIGatewayProxyEvent): void {
  const claims = event.requestContext.authorizer?.claims ?? {};
  // Cognito puts the groups claim as a comma-separated string in API Gateway
  const rawGroups = claims['cognito:groups'] ?? '';
  const groups: string[] = Array.isArray(rawGroups)
    ? rawGroups
    : String(rawGroups).split(',').map((g: string) => g.trim()).filter(Boolean);

  if (!groups.includes('admin')) {
    throw new Error('FORBIDDEN: admin access required');
  }
}
