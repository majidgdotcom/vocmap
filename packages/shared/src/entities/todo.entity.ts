export enum TodoStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export interface TodoEntity {
  todoId: string;
  userId: string;
  title: string;
  description?: string;
  status: TodoStatus;
  keywordIds: string[];
  createdAt: string; // ISO 8601
  updatedAt: string;
  archivedAt?: string;
}
