import { APIGatewayProxyEvent } from 'aws-lambda';
import { VocabularyUseCases } from '../application/vocabulary.use-cases';
import { DynamoVocabularyRepository } from '../infrastructure/dynamo-vocabulary.repository';
import { response, withErrorHandling } from './vocab-base';

const useCases = new VocabularyUseCases(new DynamoVocabularyRepository());

/**
 * GET /vocabulary/{wordKey}
 *
 * PUBLIC — no authentication required.
 * wordKey is the normalised form e.g. "figure-out", "list".
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const wordKey = event.pathParameters?.wordKey;

  if (!wordKey) {
    return response(400, { success: false, error: 'Missing wordKey', code: 'VALIDATION_ERROR' });
  }

  const entry = await useCases.getWord(wordKey);

  if (!entry) {
    return response(404, { success: false, error: `"${wordKey}" not in vocabulary`, code: 'NOT_FOUND' });
  }

  return response(200, { success: true, data: entry });
});
