import { APIGatewayProxyEvent } from 'aws-lambda';

import { GetTodosQuerySchema } from '@vocmap/shared';

import { TodoUseCases } from '../application/todo.use-cases';
import { DynamoTodoRepository } from '../infrastructure/dynamo-todo.repository';
import { getUserId, response, withErrorHandling } from './_base';

const useCases = new TodoUseCases(new DynamoTodoRepository());

export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const userId = getUserId(event);
  const query = GetTodosQuerySchema.parse(event.queryStringParameters ?? {});
  const result = await useCases.getTodos(userId, query);
  return response(200, { success: true, data: result });
});
