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
 * 1. Fetch the word family from DynamoDB.
 * 2. Transform each WordEntry → VocabEntry (group by word, build relations).
 * 3. Upsert every word:
 *      • New word  → create
 *      • Existing  → merge means (dedup by type) + merge relations (set-union)
 * 4. Mark the family record as savedToVocabulary = true.
 * 5. Return the final (merged) vocab entries.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const userId   = getUserId(event);
  const familyId = event.pathParameters?.familyId;

  if (!familyId) {
    return response(400, { success: false, error: 'Missing familyId', code: 'VALIDATION_ERROR' });
  }

  // 1. Load the family
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
  const words: { word: string; type: string; mean: string }[] =
    (familyItem.Item.words ?? []).map((w: any) => ({
      word: String(w.word),
      type: String(w.type),
      mean: String(w.mean),
    }));

  if (words.length === 0) {
    return response(400, { success: false, error: 'Family has no words', code: 'VALIDATION_ERROR' });
  }

  // 2 + 3. Transform and upsert
  const vocabEntries = await useCases.saveFamilyToVocab(userId, familyId, words);

  // 4. Mark family as saved
  await DynamoVocabularyRepository.markFamilySaved(userId, familyId);

  return response(200, {
    success: true,
    data:    vocabEntries,
    count:   vocabEntries.length,
  });
});
