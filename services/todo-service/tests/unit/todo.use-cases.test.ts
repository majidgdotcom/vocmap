import { TodoStatus } from '@vocmap/shared';

import {
  ConflictError,
  NotFoundError,
  TodoUseCases,
} from '../../src/application/todo.use-cases';
import { ITodoRepository } from '../../src/application/todo.repository.interface';
import { TodoEntity } from '@vocmap/shared';

const mockTodo: TodoEntity = {
  todoId: 'test-todo-id',
  userId: 'user-1',
  title: 'Test Todo',
  status: TodoStatus.ACTIVE,
  keywordIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockRepo: jest.Mocked<ITodoRepository> = {
  create: jest.fn().mockResolvedValue(mockTodo),
  findById: jest.fn().mockResolvedValue(mockTodo),
  findByUser: jest.fn().mockResolvedValue({ items: [mockTodo], lastKey: undefined }),
  update: jest.fn().mockResolvedValue({ ...mockTodo }),
  delete: jest.fn().mockResolvedValue(undefined),
};

describe('TodoUseCases', () => {
  let useCases: TodoUseCases;

  beforeEach(() => {
    jest.clearAllMocks();
    useCases = new TodoUseCases(mockRepo);
  });

  describe('createTodo', () => {
    it('creates and returns a todo', async () => {
      const result = await useCases.createTodo('user-1', { title: 'New Todo' });
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      expect(result.userId).toBe('user-1');
    });
  });

  describe('getTodoById', () => {
    it('throws NotFoundError when todo missing', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);
      await expect(useCases.getTodoById('user-1', 'missing-id')).rejects.toThrow(NotFoundError);
    });

    it('throws FORBIDDEN when user does not own todo', async () => {
      await expect(useCases.getTodoById('other-user', 'test-todo-id')).rejects.toThrow('FORBIDDEN');
    });
  });

  describe('archiveTodo', () => {
    it('archives an active todo', async () => {
      mockRepo.update.mockResolvedValueOnce({
        ...mockTodo,
        status: TodoStatus.ARCHIVED,
        archivedAt: new Date().toISOString(),
      });
      const result = await useCases.archiveTodo('user-1', 'test-todo-id');
      expect(result.status).toBe(TodoStatus.ARCHIVED);
    });

    it('throws ConflictError when already archived', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        ...mockTodo,
        status: TodoStatus.ARCHIVED,
      });
      await expect(useCases.archiveTodo('user-1', 'test-todo-id')).rejects.toThrow(ConflictError);
    });
  });
});
