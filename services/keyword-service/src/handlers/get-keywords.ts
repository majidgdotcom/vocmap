import { APIGatewayProxyEvent } from 'aws-lambda';

import { KeywordUseCases } from '../application/keyword.use-cases';
import { DynamoKeywordRepository } from '../infrastructure/dynamo-keyword.repository';
import { getUserId, response, withErrorHandling } from './_base';

const useCases = new KeywordUseCases(new DynamoKeywordRepository());

export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const userId = getUserId(event);
  const { todoId } = event.pathParameters ?? {};
  if (!todoId) return response(400, { success: false, error: 'Missing todoId' });

  const keywords = await useCases.getKeywords(userId, todoId);
  return response(200, { success: true, data: keywords });
});
