import { APIGatewayProxyEvent } from 'aws-lambda';

import { CreateTodoSchema } from '@vocmap/shared';

import { TodoUseCases } from '../application/todo.use-cases';
import { DynamoTodoRepository } from '../infrastructure/dynamo-todo.repository';
import { getUserId, response, withErrorHandling } from './_base';

const useCases = new TodoUseCases(new DynamoTodoRepository());

export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const userId = getUserId(event);
  const body = CreateTodoSchema.parse(JSON.parse(event.body ?? '{}'));
  const todo = await useCases.createTodo(userId, body);
  return response(201, { success: true, data: todo });
});
