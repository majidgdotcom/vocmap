import { APIGatewayProxyEvent } from 'aws-lambda';
import { GetVocabQuerySchema } from '@vocmap/shared';
import { VocabularyUseCases } from '../application/vocabulary.use-cases';
import { DynamoVocabularyRepository } from '../infrastructure/dynamo-vocabulary.repository';
import { response, withErrorHandling } from './vocab-base';

const useCases = new VocabularyUseCases(new DynamoVocabularyRepository());

/**
 * GET /vocabulary?limit=50&lastKey=...&search=fig
 *
 * PUBLIC — no authentication required.
 * Returns paginated vocabulary entries in alphabetical A→Z order.
 * `search` is a prefix match on the normalised word key.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const query  = GetVocabQuerySchema.parse(event.queryStringParameters ?? {});
  const result = await useCases.listVocab(query);

  return response(200, {
    success: true,
    data:    result.items,
    count:   result.items.length,
    lastKey: result.lastKey,
  });
});
