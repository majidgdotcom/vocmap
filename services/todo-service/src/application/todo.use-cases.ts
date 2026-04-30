import {
  CreateTodoInput,
  GetTodosQuery,
  TodoEntity,
  UpdateTodoInput,
} from '@vocmap/shared';

import { TodoDomain } from '../domain/todo.domain';
import { ITodoRepository, PaginatedResult } from './todo.repository.interface';

export class TodoUseCases {
  constructor(private readonly repo: ITodoRepository) {}

  async createTodo(userId: string, input: CreateTodoInput): Promise<TodoEntity> {
    const todo = TodoDomain.create({ userId, ...input });
    return this.repo.create(todo);
  }

  async getTodos(userId: string, query: GetTodosQuery): Promise<PaginatedResult<TodoEntity>> {
    return this.repo.findByUser(userId, query);
  }

  async getTodoById(userId: string, todoId: string): Promise<TodoEntity> {
    const todo = await this.repo.findById(userId, todoId);
    if (!todo) throw new NotFoundError(`Todo ${todoId} not found`);
    TodoDomain.assertOwnership(todo, userId);
    return todo;
  }

  async updateTodo(userId: string, todoId: string, input: UpdateTodoInput): Promise<TodoEntity> {
    const existing = await this.getTodoById(userId, todoId);
    const updated = TodoDomain.update(existing, input);
    return this.repo.update(updated);
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    await this.getTodoById(userId, todoId); // ownership check
    await this.repo.delete(userId, todoId);
  }

  async archiveTodo(userId: string, todoId: string): Promise<TodoEntity> {
    const existing = await this.getTodoById(userId, todoId);
    const archived = TodoDomain.archive(existing);
    if (!archived) throw new ConflictError(`Todo ${todoId} is already archived`);
    return this.repo.update(archived);
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  readonly statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
