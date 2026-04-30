import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Keys } from '@vocmap/shared';

import { getUserId, response, withErrorHandling } from './_base';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.DYNAMO_TABLE!;

/**
 * Resolve all todoIds that have a given keyword, then fetch those todos.
 * Uses GSI1 on the keyword items: GSI1PK = TODO#<todoId>, GSI1SK = KEYWORD#<keywordId>
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const userId = getUserId(event);
  const { keywordId } = event.pathParameters ?? {};
  if (!keywordId) return response(400, { success: false, error: 'Missing keywordId' });

  // Step 1: find all keyword items that match keywordId
  const kwRes = await client.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1SK = :kwSk',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':kwSk': Keys.keyword.gsi1sk(keywordId),
        ':userId': userId,
      },
    }),
  );

  const todoIds = [...new Set((kwRes.Items ?? []).map((i) => i.todoId as string))];

  if (todoIds.length === 0) {
    return response(200, { success: true, data: [] });
  }

  // Step 2: batch-fetch each todo (DynamoDB doesn't support IN queries natively)
  const todos = await Promise.all(
    todoIds.map((todoId) =>
      client.send(
        new QueryCommand({
          TableName: TABLE,
          KeyConditionExpression: 'PK = :pk AND SK = :sk',
          ExpressionAttributeValues: {
            ':pk': Keys.todo.pk(userId),
            ':sk': Keys.todo.sk(todoId),
          },
        }),
      ),
    ),
  );

  const todoItems = todos.flatMap((r) => r.Items ?? []);
  return response(200, { success: true, data: todoItems });
});
