import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { KeywordEntity, Keys } from '@vocmap/shared';

import { IKeywordRepository } from '../application/keyword.repository.interface';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.DYNAMO_TABLE!;

export class DynamoKeywordRepository implements IKeywordRepository {
  /**
   * Write multiple keywords in a single DynamoDB transaction (max 25 items).
   */
  async addMany(keywords: KeywordEntity[]): Promise<KeywordEntity[]> {
    const chunks = chunkArray(keywords, 25);

    for (const chunk of chunks) {
      await client.send(
        new TransactWriteCommand({
          TransactItems: chunk.map((kw) => ({
            Put: {
              TableName: TABLE,
              Item: {
                PK: Keys.keyword.pk(kw.userId),
                SK: Keys.keyword.sk(kw.todoId, kw.keywordId),
                GSI1PK: Keys.keyword.gsi1pk(kw.todoId),
                GSI1SK: Keys.keyword.gsi1sk(kw.keywordId),
                type: 'KEYWORD',
                ...kw,
              },
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          })),
        }),
      );
    }

    return keywords;
  }

  async findByTodo(todoId: string, userId: string): Promise<KeywordEntity[]> {
    const res = await client.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':gsi1pk': Keys.keyword.gsi1pk(todoId),
          ':prefix': 'KEYWORD#',
          ':userId': userId,
        },
      }),
    );
    return (res.Items ?? []).map(this.mapItem);
  }

  async findById(
    userId: string,
    todoId: string,
    keywordId: string,
  ): Promise<KeywordEntity | null> {
    const res = await client.send(
      new GetCommand({
        TableName: TABLE,
        Key: {
          PK: Keys.keyword.pk(userId),
          SK: Keys.keyword.sk(todoId, keywordId),
        },
      }),
    );
    return res.Item ? this.mapItem(res.Item) : null;
  }

  async delete(userId: string, todoId: string, keywordId: string): Promise<void> {
    await client.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: {
          PK: Keys.keyword.pk(userId),
          SK: Keys.keyword.sk(todoId, keywordId),
        },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }

  /**
   * Transactionally update the todo item's keywordIds list.
   * Uses a conditional write to prevent lost updates.
   */
  async syncTodoKeywordIds(
    userId: string,
    todoId: string,
    keywordIds: string[],
  ): Promise<void> {
    await client.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: {
          PK: Keys.todo.pk(userId),
          SK: Keys.todo.sk(todoId),
        },
        UpdateExpression: 'SET keywordIds = :ids, updatedAt = :now',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeValues: {
          ':ids': keywordIds,
          ':now': new Date().toISOString(),
        },
      }),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapItem(item: Record<string, any>): KeywordEntity {
    return {
      keywordId: item.keywordId,
      todoId: item.todoId,
      userId: item.userId,
      label: item.label,
      color: item.color,
      createdAt: item.createdAt,
    };
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
