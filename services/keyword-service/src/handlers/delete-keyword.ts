import { APIGatewayProxyEvent } from 'aws-lambda';

import { KeywordUseCases } from '../application/keyword.use-cases';
import { DynamoKeywordRepository } from '../infrastructure/dynamo-keyword.repository';
import { getUserId, response, withErrorHandling } from './_base';

const useCases = new KeywordUseCases(new DynamoKeywordRepository());

export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const userId = getUserId(event);
  const { todoId, keywordId } = event.pathParameters ?? {};
  if (!todoId || !keywordId)
    return response(400, { success: false, error: 'Missing todoId or keywordId' });

  await useCases.deleteKeyword(userId, todoId, keywordId);
  return response(204, { success: true, data: null });
});
