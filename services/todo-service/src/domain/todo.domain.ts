import { v4 as uuidv4 } from 'uuid';

import { TodoEntity, TodoStatus } from '@vocmap/shared';

export class TodoDomain {
  /**
   * Factory: create a new Todo entity (not persisted yet).
   */
  static create(params: {
    userId: string;
    title: string;
    description?: string;
  }): TodoEntity {
    const now = new Date().toISOString();
    return {
      todoId: uuidv4(),
      userId: params.userId,
      title: params.title.trim(),
      description: params.description?.trim(),
      status: TodoStatus.ACTIVE,
      keywordIds: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Apply partial updates and bump updatedAt.
   */
  static update(
    todo: TodoEntity,
    patch: Partial<Pick<TodoEntity, 'title' | 'description' | 'status'>>,
  ): TodoEntity {
    return {
      ...todo,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Archive a todo — idempotent, returns null if already archived.
   */
  static archive(todo: TodoEntity): TodoEntity | null {
    if (todo.status === TodoStatus.ARCHIVED) return null;
    const now = new Date().toISOString();
    return {
      ...todo,
      status: TodoStatus.ARCHIVED,
      archivedAt: now,
      updatedAt: now,
    };
  }

  /**
   * Guard: caller must own the todo.
   */
  static assertOwnership(todo: TodoEntity, userId: string): void {
    if (todo.userId !== userId) {
      throw new Error('FORBIDDEN: user does not own this todo');
    }
  }
}
