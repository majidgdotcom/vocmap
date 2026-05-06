import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

import { Keys } from '@vocmap/shared';

import { VocabularyUseCases } from '../application/vocabulary.use-cases';
import { DynamoVocabularyRepository } from '../infrastructure/dynamo-vocabulary.repository';
import { getUserId, response, withErrorHandling, assertAdmin } from './vocab-base';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE     = process.env.DYNAMO_TABLE!;
const repo      = new DynamoVocabularyRepository();
const useCases  = new VocabularyUseCases(repo);

/**
 * POST /vocabulary/from-family/{familyId}
 *
 * ADMIN ONLY — transforms a user's word family into global vocabulary entries.
 *
 * 1. Verify caller is admin.
 * 2. Fetch the family record (still user-scoped).
 * 3. Transform + upsert each word into the global vocabulary.
 * 4. Mark the family as savedToVocabulary = true.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  assertAdmin(event);
  const userId   = getUserId(event);   // still needed to look up the family
  const familyId = event.pathParameters?.familyId;

  if (!familyId) {
    return response(400, { success: false, error: 'Missing familyId', code: 'VALIDATION_ERROR' });
  }

  // Fetch the user's family record
  const familyItem = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: {
      PK: Keys.wordFamily.pk(userId),
      SK: Keys.wordFamily.sk(familyId),
    },
  }));

  if (!familyItem.Item) {
    return response(404, { success: false, error: `Family ${familyId} not found`, code: 'NOT_FOUND' });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const words: { word: string; type: string; lang?: string; mean: string }[] =
    (familyItem.Item.words ?? []).map((w: any) => ({
      word: String(w.word),
      type: String(w.type),
      lang: w.lang ? String(w.lang) : undefined,
      mean: String(w.mean),
    }));

  if (words.length === 0) {
    return response(400, { success: false, error: 'Family has no words', code: 'VALIDATION_ERROR' });
  }

  // Upsert into global vocabulary (no userId)
  const vocabEntries = await useCases.saveFamilyToVocab(familyId, words);

  // Mark family as saved (still user-scoped)
  await DynamoVocabularyRepository.markFamilySaved(userId, familyId);

  return response(200, {
    success: true,
    data:    vocabEntries,
    count:   vocabEntries.length,
  });
});
