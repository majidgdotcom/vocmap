import { TodoEntity, TodoStatus } from '@vocmap/shared';

/** Pure data transformation — no React hooks, fully testable. */
export interface TodoViewModel {
  todoId: string;
  title: string;
  description: string;
  statusLabel: string;
  statusColor: 'green' | 'blue' | 'gray';
  isArchived: boolean;
  isCompleted: boolean;
  isActive: boolean;
  keywordCount: number;
  createdAtFormatted: string;
  updatedAtFormatted: string;
  archivedAtFormatted?: string;
  canEdit: boolean;
  canArchive: boolean;
  canDelete: boolean;
}

export function toTodoViewModel(todo: TodoEntity): TodoViewModel {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));

  const statusMap: Record<TodoStatus, { label: string; color: TodoViewModel['statusColor'] }> = {
    [TodoStatus.ACTIVE]: { label: 'Active', color: 'green' },
    [TodoStatus.COMPLETED]: { label: 'Completed', color: 'blue' },
    [TodoStatus.ARCHIVED]: { label: 'Archived', color: 'gray' },
  };

  const { label: statusLabel, color: statusColor } = statusMap[todo.status];
  const isArchived = todo.status === TodoStatus.ARCHIVED;

  return {
    todoId: todo.todoId,
    title: todo.title,
    description: todo.description ?? '',
    statusLabel,
    statusColor,
    isArchived,
    isCompleted: todo.status === TodoStatus.COMPLETED,
    isActive: todo.status === TodoStatus.ACTIVE,
    keywordCount: todo.keywordIds.length,
    createdAtFormatted: fmt(todo.createdAt),
    updatedAtFormatted: fmt(todo.updatedAt),
    archivedAtFormatted: todo.archivedAt ? fmt(todo.archivedAt) : undefined,
    canEdit: !isArchived,
    canArchive: !isArchived,
    canDelete: true,
  };
}

export function toTodoViewModelList(todos: TodoEntity[]): TodoViewModel[] {
  return todos.map(toTodoViewModel);
}
