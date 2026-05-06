import { APIGatewayProxyEvent } from 'aws-lambda';

import { WordFamilyUseCases } from '../application/word-family.use-cases';
import { DynamoWordFamilyRepository } from '../infrastructure/dynamo-word-family.repository';
import { getUserId, response, withErrorHandling, assertAdmin } from './_base';

const useCases = new WordFamilyUseCases(new DynamoWordFamilyRepository());

/**
 * DELETE /word-families/{familyId}
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEvent) => {
    assertAdmin(event);
  const userId = getUserId(event);
    const { familyId } = event.pathParameters ?? {};

    if (!familyId) {
      return response(400, {
        success: false,
        error: 'Missing familyId',
        code: 'VALIDATION_ERROR',
      });
    }

    await useCases.deleteFamily(userId, familyId);

    return response(204, null);
  },
);
