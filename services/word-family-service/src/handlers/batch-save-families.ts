import { APIGatewayProxyEvent } from 'aws-lambda';

import { BatchSaveFamiliesSchema } from '@vocmap/shared';

import { WordFamilyUseCases } from '../application/word-family.use-cases';
import { DynamoWordFamilyRepository } from '../infrastructure/dynamo-word-family.repository';
import { getUserId, response, withErrorHandling, assertAdmin } from './_base';

const useCases = new WordFamilyUseCases(new DynamoWordFamilyRepository());

/**
 * POST /word-families/batch
 *
 * Body: { families: SaveWordFamilyInput[] }   (1–50 items)
 *
 * Validates every family with Zod, creates entities via the domain,
 * then batch-writes all of them to DynamoDB in chunks of 25.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEvent) => {
    assertAdmin(event);
  const userId = getUserId(event);

    const body = BatchSaveFamiliesSchema.parse(
      JSON.parse(event.body ?? '{}'),
    );

    const saved = await useCases.saveBatch(userId, body);

    return response(201, {
      success: true,
      data: saved,
      count: saved.length,
    });
  },
);
