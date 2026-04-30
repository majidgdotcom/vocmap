import { describe, it, expect } from 'vitest';

import { TodoStatus, TodoEntity } from '@vocmap/shared';
import { toTodoViewModel } from '../../src/viewmodels/todo.viewmodel';

const base: TodoEntity = {
  todoId: 'abc-123',
  userId: 'user-1',
  title: 'Buy groceries',
  description: 'Milk, eggs, bread',
  status: TodoStatus.ACTIVE,
  keywordIds: ['kw-1', 'kw-2'],
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T12:00:00.000Z',
};

describe('toTodoViewModel', () => {
  it('maps active todo correctly', () => {
    const vm = toTodoViewModel(base);
    expect(vm.todoId).toBe('abc-123');
    expect(vm.statusLabel).toBe('Active');
    expect(vm.statusColor).toBe('green');
    expect(vm.isActive).toBe(true);
    expect(vm.isArchived).toBe(false);
    expect(vm.isCompleted).toBe(false);
    expect(vm.keywordCount).toBe(2);
    expect(vm.canEdit).toBe(true);
    expect(vm.canArchive).toBe(true);
    expect(vm.canDelete).toBe(true);
  });

  it('maps archived todo correctly — disables edit/archive', () => {
    const vm = toTodoViewModel({
      ...base,
      status: TodoStatus.ARCHIVED,
      archivedAt: '2024-02-01T09:00:00.000Z',
    });
    expect(vm.statusLabel).toBe('Archived');
    expect(vm.statusColor).toBe('gray');
    expect(vm.isArchived).toBe(true);
    expect(vm.canEdit).toBe(false);
    expect(vm.canArchive).toBe(false);
    expect(vm.canDelete).toBe(true);
    expect(vm.archivedAtFormatted).toBeDefined();
  });

  it('maps completed todo correctly', () => {
    const vm = toTodoViewModel({ ...base, status: TodoStatus.COMPLETED });
    expect(vm.statusLabel).toBe('Completed');
    expect(vm.statusColor).toBe('blue');
    expect(vm.isCompleted).toBe(true);
  });

  it('truncates description correctly in display (view model passes raw)', () => {
    const longDesc = 'x'.repeat(500);
    const vm = toTodoViewModel({ ...base, description: longDesc });
    // ViewModel stores raw; truncation is the card's responsibility
    expect(vm.description).toBe(longDesc);
  });

  it('handles missing description gracefully', () => {
    const vm = toTodoViewModel({ ...base, description: undefined });
    expect(vm.description).toBe('');
  });
});
