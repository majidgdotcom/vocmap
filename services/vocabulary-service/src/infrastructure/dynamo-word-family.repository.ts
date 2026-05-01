import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
  QueryCommand,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { WordFamilyEntity, Keys } from '@vocmap/shared';
import { GetFamiliesQuery } from '@vocmap/shared';

import {
  IWordFamilyRepository,
  PaginatedResult,
} from '../application/word-family.repository.interface';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.DYNAMO_TABLE!;

export class DynamoWordFamilyRepository implements IWordFamilyRepository {
  // ── Batch save ─────────────────────────────────────────────────────────────

  async saveBatch(families: WordFamilyEntity[]): Promise<WordFamilyEntity[]> {
    // BatchWrite accepts at most 25 items per call — split into chunks.
    const chunks = chunkArray(families, 25);

    for (const chunk of chunks) {
      const writeRequests = chunk.map((f) => ({
        PutRequest: {
          Item: {
            PK: Keys.wordFamily.pk(f.userId),
            SK: Keys.wordFamily.sk(f.familyId),
            GSI1PK: Keys.wordFamily.gsi1pk(f.userId),
            GSI1SK: Keys.wordFamily.gsi1sk(f.savedAt),
            type: 'WORD_FAMILY',
            ...f,
          },
        },
      }));

      const result = await client.send(
        new BatchWriteCommand({ RequestItems: { [TABLE]: writeRequests } }),
      );

      // Retry any unprocessed items (DynamoDB may return them under throttle)
      let unprocessed = result.UnprocessedItems?.[TABLE];
      let retries = 0;
      while (unprocessed && unprocessed.length > 0 && retries < 3) {
        await sleep(200 * 2 ** retries); // exponential back-off: 200 ms, 400 ms, 800 ms
        const retry = await client.send(
          new BatchWriteCommand({ RequestItems: { [TABLE]: unprocessed } }),
        );
        unprocessed = retry.UnprocessedItems?.[TABLE];
        retries++;
      }
    }

    return families;
  }

  // ── List (paginated, newest first via GSI1) ────────────────────────────────

  async findByUser(
    userId: string,
    query: GetFamiliesQuery,
  ): Promise<PaginatedResult<WordFamilyEntity>> {
    const { limit, lastKey, tag } = query;

    const res = await client.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression:
          'GSI1PK = :pk AND begins_with(GSI1SK, :prefix)',
        // Optional tag filter — applied as a post-key FilterExpression
        FilterExpression: tag
          ? 'contains(tags, :tag)'
          : undefined,
        ExpressionAttributeValues: {
          ':pk': Keys.wordFamily.gsi1pk(userId),
          ':prefix': 'SAVED#',
          ...(tag ? { ':tag': tag } : {}),
        },
        Limit: limit,
        ScanIndexForward: false, // newest first
        ExclusiveStartKey: lastKey
          ? JSON.parse(Buffer.from(lastKey, 'base64').toString())
          : undefined,
      }),
    );

    return {
      items: (res.Items ?? []).map(this.mapItem),
      lastKey: res.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }

  // ── Get by ID ──────────────────────────────────────────────────────────────

  async findById(
    userId: string,
    familyId: string,
  ): Promise<WordFamilyEntity | null> {
    const res = await client.send(
      new GetCommand({
        TableName: TABLE,
        Key: {
          PK: Keys.wordFamily.pk(userId),
          SK: Keys.wordFamily.sk(familyId),
        },
      }),
    );
    return res.Item ? this.mapItem(res.Item) : null;
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async delete(userId: string, familyId: string): Promise<void> {
    await client.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: {
          PK: Keys.wordFamily.pk(userId),
          SK: Keys.wordFamily.sk(familyId),
        },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }

  // ── Mapping ────────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapItem(item: Record<string, any>): WordFamilyEntity {
    return {
      familyId: item.familyId,
      userId: item.userId,
      title: item.title,
      words: item.words ?? [],
      tags: item.tags ?? [],
      notes: item.notes ?? '',
      wordCount: item.wordCount ?? item.words?.length ?? 0,
      savedAt: item.savedAt,
      updatedAt: item.updatedAt,
    };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
