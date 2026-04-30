import { APIGatewayProxyEvent } from 'aws-lambda';

import { UpdateTodoSchema } from '@vocmap/shared';

import { TodoUseCases } from '../application/todo.use-cases';
import { DynamoTodoRepository } from '../infrastructure/dynamo-todo.repository';
import { getUserId, response, withErrorHandling } from './_base';

const useCases = new TodoUseCases(new DynamoTodoRepository());

export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const userId = getUserId(event);
  const { todoId } = event.pathParameters ?? {};
  if (!todoId) return response(400, { success: false, error: 'Missing todoId' });
  const body = UpdateTodoSchema.parse(JSON.parse(event.body ?? '{}'));
  const updated = await useCases.updateTodo(userId, todoId, body);
  return response(200, { success: true, data: updated });
});
