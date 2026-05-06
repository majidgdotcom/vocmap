import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { Keys } from '@vocmap/shared';

import { scrapeCambridgeWord, WordNotFoundError, WordNotAvailableError } from '../scraper/cambridge.scraper';
import { getUserId, response, withErrorHandling, assertAdmin } from './vocab-base';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3     = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
const TABLE  = process.env.DYNAMO_TABLE!;
const BUCKET = process.env.AUDIO_BUCKET!;

/**
 * POST /vocabulary/{wordKey}/enrich
 *
 * ADMIN ONLY — scrapes Cambridge and merges data into the global vocab entry.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  assertAdmin(event);
  // userId not needed for vocab — only for logging/audit if desired
  const wordKey = event.pathParameters?.wordKey;

  if (!wordKey) {
    return response(400, { success: false, error: 'Missing wordKey', code: 'VALIDATION_ERROR' });
  }

  // Load from global vocabulary (no userId in key)
  const existing = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: {
      PK: Keys.vocab.pk(),
      SK: Keys.vocab.sk(wordKey),
    },
  }));

  if (!existing.Item) {
    return response(404, { success: false, error: `"${wordKey}" not in vocabulary`, code: 'NOT_FOUND' });
  }

  const displayWord = (existing.Item.word as string) ?? wordKey.replace(/-/g, ' ');

  let scraped;
  try {
    scraped = await scrapeCambridgeWord(displayWord);
  } catch (err) {
    if (err instanceof WordNotFoundError || err instanceof WordNotAvailableError) {
      await dynamo.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: Keys.vocab.pk(), SK: Keys.vocab.sk(wordKey) },
        UpdateExpression: 'SET cambridge = :c, updatedAt = :now',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeValues: {
          ':c':   { notAvailable: true, checkedAt: new Date().toISOString() },
          ':now': new Date().toISOString(),
        },
      }));
      return response(404, {
        success: false,
        error:   `Not available in Cambridge: "${displayWord}"`,
        code:    'CAMBRIDGE_NOT_AVAILABLE',
      });
    }
    throw err;
  }

  const [usKey, ukKey] = await Promise.all([
    scraped.usAudio ? uploadAudio(scraped.usAudio, `audio/${wordKey}-us.mp3`) : Promise.resolve(undefined),
    scraped.ukAudio ? uploadAudio(scraped.ukAudio, `audio/${wordKey}-uk.mp3`) : Promise.resolve(undefined),
  ]);

  const cambridge = {
    phonetic: { us: scraped.usPhonetic, uk: scraped.ukPhonetic },
    audio:    { usKey, ukKey },
    definitions: scraped.definitions,
    fetchedAt: new Date().toISOString(),
  };

  await dynamo.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: Keys.vocab.pk(), SK: Keys.vocab.sk(wordKey) },
    UpdateExpression: 'SET cambridge = :c, updatedAt = :now',
    ConditionExpression: 'attribute_exists(PK)',
    ExpressionAttributeValues: { ':c': cambridge, ':now': new Date().toISOString() },
  }));

  return response(200, { success: true, data: { ...existing.Item, cambridge } });
});

async function uploadAudio(buffer: Buffer, key: string): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: buffer, ContentType: 'audio/mpeg',
  }));
  return key;
}
