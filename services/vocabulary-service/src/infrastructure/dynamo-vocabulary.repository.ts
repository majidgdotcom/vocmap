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

import { IVocabularyRepository, PaginatedVocab } from '../application/vocabulary.repository.interface';
import { VocabularyDomain } from '../domain/vocabulary.domain';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE  = process.env.DYNAMO_TABLE!;

export class DynamoVocabularyRepository implements IVocabularyRepository {

  // ── Single get ─────────────────────────────────────────────────────────────

  async findByWordKey(wordKey: string): Promise<VocabEntry | null> {
    const res = await client.send(new GetCommand({
      TableName: TABLE,
      Key: {
        PK: Keys.vocab.pk(),
        SK: Keys.vocab.sk(wordKey),
      },
    }));
    return res.Item ? this.map(res.Item) : null;
  }

  // ── Upsert (sequential to preserve merge correctness) ────────────────────

  async upsertMany(entries: VocabEntry[]): Promise<VocabEntry[]> {
    const results: VocabEntry[] = [];

    for (const incoming of entries) {
      const existing = await this.findByWordKey(incoming.wordKey);
      const final    = existing ? VocabularyDomain.merge(existing, incoming) : incoming;

      await client.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK:     Keys.vocab.pk(),
          SK:     Keys.vocab.sk(final.wordKey),
          GSI1PK: Keys.vocab.gsi1pk(),
          GSI1SK: Keys.vocab.gsi1sk(final.wordKey),
          type:   'VOCABULARY',
          ...final,
        },
      }));

      results.push(final);
    }

    return results;
  }

  // ── Paginated list (alphabetical) ─────────────────────────────────────────

  async list(query: GetVocabQuery): Promise<PaginatedVocab> {
    const { limit, lastKey, search } = query;

    const res = await client.send(new QueryCommand({
      TableName:                 TABLE,
      IndexName:                 'GSI1',
      KeyConditionExpression:    'GSI1PK = :pk AND begins_with(GSI1SK, :prefix)',
      FilterExpression:          '#type = :typeVal',
      ExpressionAttributeNames:  { '#type': 'type' },
      ExpressionAttributeValues: {
        ':pk':      Keys.vocab.gsi1pk(),
        ':prefix':  search ? `VOCAB#${normalizeWordKey(search)}` : 'VOCAB#',
        ':typeVal': 'VOCABULARY',
      },
      Limit:             limit,
      ScanIndexForward:  true,
      ExclusiveStartKey: lastKey
        ? JSON.parse(Buffer.from(lastKey, 'base64').toString())
        : undefined,
    }));

    return {
      items:   (res.Items ?? []).map(this.map.bind(this)),
      lastKey: res.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async delete(wordKey: string): Promise<void> {
    await client.send(new DeleteCommand({
      TableName: TABLE,
      Key: {
        PK: Keys.vocab.pk(),
        SK: Keys.vocab.sk(wordKey),
      },
    }));
  }

  // ── Mark family as saved-to-vocabulary (still user-scoped) ───────────────

  static async markFamilySaved(userId: string, familyId: string): Promise<void> {
    await client.send(new UpdateCommand({
      TableName: TABLE,
      Key: {
        PK: Keys.wordFamily.pk(userId),
        SK: Keys.wordFamily.sk(familyId),
      },
      UpdateExpression:          'SET savedToVocabulary = :t, updatedAt = :now',
      ConditionExpression:       'attribute_exists(PK)',
      ExpressionAttributeValues: { ':t': true, ':now': new Date().toISOString() },
    }));
  }

  // ── Mapper ─────────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map(item: Record<string, any>): VocabEntry {
    return {
      vocabId:   item.vocabId,
      wordKey:   item.wordKey,
      word:      item.word,
      means:     item.means     ?? [],
      relations: item.relations ?? [],
      familyIds: item.familyIds ?? [],
      savedAt:   item.savedAt,
      updatedAt: item.updatedAt,
      cambridge: item.cambridge,
    };
  }
}
