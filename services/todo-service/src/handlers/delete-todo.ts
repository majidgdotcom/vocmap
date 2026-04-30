import { APIGatewayProxyEvent } from 'aws-lambda';

import { TodoUseCases } from '../application/todo.use-cases';
import { DynamoTodoRepository } from '../infrastructure/dynamo-todo.repository';
import { getUserId, response, withErrorHandling } from './_base';

const useCases = new TodoUseCases(new DynamoTodoRepository());

export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const userId = getUserId(event);
  const { todoId } = event.pathParameters ?? {};
  if (!todoId) return response(400, { success: false, error: 'Missing todoId' });
  await useCases.deleteTodo(userId, todoId);
  return response(204, { success: true, data: null });
});
