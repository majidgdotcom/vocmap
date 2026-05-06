import { APIGatewayProxyEvent } from 'aws-lambda';

import { GetFamiliesQuerySchema } from '@vocmap/shared';

import { WordFamilyUseCases } from '../application/word-family.use-cases';
import { DynamoWordFamilyRepository } from '../infrastructure/dynamo-word-family.repository';
import { getUserId, response, withErrorHandling, assertAdmin } from './_base';

const useCases = new WordFamilyUseCases(new DynamoWordFamilyRepository());

/**
 * GET /word-families?limit=50&lastKey=...&tag=B2
 *
 * Returns a paginated, newest-first list of the caller's saved word families.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEvent) => {
    assertAdmin(event);
  const userId = getUserId(event);

    const query = GetFamiliesQuerySchema.parse(
      event.queryStringParameters ?? {},
    );

    const result = await useCases.listFamilies(userId, query);

    return response(200, {
      success: true,
      data: result.items,
      count: result.items.length,
      lastKey: result.lastKey,
    });
  },
);
