import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { GetTodosQuery, Keys, TodoEntity, TodoStatus } from '@vocmap/shared';

import { ITodoRepository, PaginatedResult } from '../application/todo.repository.interface';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.DYNAMO_TABLE!;

export class DynamoTodoRepository implements ITodoRepository {
  async create(todo: TodoEntity): Promise<TodoEntity> {
    const item = {
      PK: Keys.todo.pk(todo.userId),
      SK: Keys.todo.sk(todo.todoId),
      GSI1PK: Keys.todo.gsi1pk(todo.userId),
      GSI1SK: Keys.todo.gsi1sk(todo.createdAt),
      type: 'TODO',
      ...todo,
    };

    await client.send(
      new PutCommand({
        TableName: TABLE,
        Item: item,
        // Conditional write: prevent overwrite
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );

    return todo;
  }

  async findById(userId: string, todoId: string): Promise<TodoEntity | null> {
    const res = await client.send(
      new GetCommand({
        TableName: TABLE,
        Key: {
          PK: Keys.todo.pk(userId),
          SK: Keys.todo.sk(todoId),
        },
      }),
    );
    return res.Item ? this.mapItem(res.Item) : null;
  }

  async findByUser(
    userId: string,
    query: GetTodosQuery,
  ): Promise<PaginatedResult<TodoEntity>> {
    const { status, limit, lastKey } = query;

    const res = await client.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :prefix)',
        FilterExpression: status ? '#status = :status' : undefined,
        ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
        ExpressionAttributeValues: {
          ':pk': Keys.todo.gsi1pk(userId),
          ':prefix': 'CREATED#',
          ...(status ? { ':status': status } : {}),
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

  async update(todo: TodoEntity): Promise<TodoEntity> {
    await client.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: {
          PK: Keys.todo.pk(todo.userId),
          SK: Keys.todo.sk(todo.todoId),
        },
        UpdateExpression:
          'SET title = :title, #desc = :desc, #status = :status, updatedAt = :updatedAt, archivedAt = :archivedAt',
        ConditionExpression: 'attribute_exists(PK)', // optimistic locking
        ExpressionAttributeNames: {
          '#desc': 'description',
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':title': todo.title,
          ':desc': todo.description ?? null,
          ':status': todo.status,
          ':updatedAt': todo.updatedAt,
          ':archivedAt': todo.archivedAt ?? null,
        },
      }),
    );
    return todo;
  }

  async delete(userId: string, todoId: string): Promise<void> {
    await client.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: {
          PK: Keys.todo.pk(userId),
          SK: Keys.todo.sk(todoId),
        },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapItem(item: Record<string, any>): TodoEntity {
    return {
      todoId: item.todoId,
      userId: item.userId,
      title: item.title,
      description: item.description,
      status: item.status as TodoStatus,
      keywordIds: item.keywordIds ?? [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      archivedAt: item.archivedAt,
    };
  }
}
