import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { VocabEntry, Keys, normalizeWordKey } from '@vocmap/shared';
import { GetVocabQuery } from '@vocmap/shared';

import {
  IVocabularyRepository,
  PaginatedVocab,
} from '../application/vocabulary.repository.interface';
import { VocabularyDomain } from '../domain/vocabulary.domain';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE  = process.env.DYNAMO_TABLE!;

export class DynamoVocabularyRepository implements IVocabularyRepository {

  // ── Single get ─────────────────────────────────────────────────────────────

  async findByWordKey(userId: string, wordKey: string): Promise<VocabEntry | null> {
    const res = await client.send(new GetCommand({
      TableName: TABLE,
      Key: {
        PK: Keys.vocab.pk(userId),
        SK: Keys.vocab.sk(wordKey),
      },
    }));
    return res.Item ? this.map(res.Item) : null;
  }

  // ── Upsert many (sequential — preserves merge correctness) ────────────────

  async upsertMany(entries: VocabEntry[]): Promise<VocabEntry[]> {
    const results: VocabEntry[] = [];

    for (const incoming of entries) {
      const existing = await this.findByWordKey(incoming.userId, incoming.wordKey);

      const final = existing
        ? VocabularyDomain.merge(existing, incoming)
        : incoming;

      await client.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK:      Keys.vocab.pk(final.userId),
          SK:      Keys.vocab.sk(final.wordKey),
          GSI1PK:  Keys.vocab.gsi1pk(final.userId),
          GSI1SK:  Keys.vocab.gsi1sk(final.wordKey),
          type:    'VOCABULARY',
          ...final,
        },
      }));

      results.push(final);
    }

    return results;
  }

  // ── Paginated list (alphabetical via GSI1) ────────────────────────────────

  async findByUser(userId: string, query: GetVocabQuery): Promise<PaginatedVocab> {
    const { limit, lastKey, search } = query;

    // search is a begins_with on the GSI1SK — "VOCAB#fig" matches all "fig*" words
    const skCondition = search
      ? 'GSI1PK = :pk AND begins_with(GSI1SK, :prefix)'
      : 'GSI1PK = :pk AND begins_with(GSI1SK, :prefix)';

    const res = await client.send(new QueryCommand({
      TableName:                 TABLE,
      IndexName:                 'GSI1',
      KeyConditionExpression:    skCondition,
      FilterExpression:          'begins_with(#type, :typeVal)',
      ExpressionAttributeNames:  { '#type': 'type' },
      ExpressionAttributeValues: {
        ':pk':      Keys.vocab.gsi1pk(userId),
        ':prefix':  search
          ? `VOCAB#${normalizeWordKey(search)}`
          : 'VOCAB#',
        ':typeVal': 'VOCABULARY',
      },
      Limit:             limit,
      ScanIndexForward:  true,   // alphabetical A → Z
      ExclusiveStartKey: lastKey
        ? JSON.parse(Buffer.from(lastKey, 'base64').toString())
        : undefined,
    }));

    return {
      items:   (res.Items ?? []).map(this.map),
      lastKey: res.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async delete(userId: string, wordKey: string): Promise<void> {
    await client.send(new DeleteCommand({
      TableName: TABLE,
      Key: {
        PK: Keys.vocab.pk(userId),
        SK: Keys.vocab.sk(wordKey),
      },
    }));
  }

  // ── Mark the source family as saved-to-vocabulary ─────────────────────────

  static async markFamilySaved(userId: string, familyId: string): Promise<void> {
    await client.send(new UpdateCommand({
      TableName:                 TABLE,
      Key: {
        PK: Keys.wordFamily.pk(userId),
        SK: Keys.wordFamily.sk(familyId),
      },
      UpdateExpression:          'SET savedToVocabulary = :t, updatedAt = :now',
      ConditionExpression:       'attribute_exists(PK)',
      ExpressionAttributeValues: {
        ':t':   true,
        ':now': new Date().toISOString(),
      },
    }));
  }

  // ── Mapper ─────────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map(item: Record<string, any>): VocabEntry {
    return {
      vocabId:   item.vocabId,
      wordKey:   item.wordKey,
      word:      item.word,
      userId:    item.userId,
      means:     item.means     ?? [],
      relations: item.relations ?? [],
      familyIds: item.familyIds ?? [],
      savedAt:   item.savedAt,
      updatedAt: item.updatedAt,
    };
  }
}
