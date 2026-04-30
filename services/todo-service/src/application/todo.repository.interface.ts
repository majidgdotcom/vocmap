import { GetTodosQuery, TodoEntity } from '@vocmap/shared';

export interface PaginatedResult<T> {
  items: T[];
  lastKey?: string;
}

export interface ITodoRepository {
  create(todo: TodoEntity): Promise<TodoEntity>;
  findById(userId: string, todoId: string): Promise<TodoEntity | null>;
  findByUser(userId: string, query: GetTodosQuery): Promise<PaginatedResult<TodoEntity>>;
  update(todo: TodoEntity): Promise<TodoEntity>;
  delete(userId: string, todoId: string): Promise<void>;
}
