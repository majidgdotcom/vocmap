import { KeywordEntity } from '../entities/keyword.entity';
import { TodoEntity } from '../entities/todo.entity';

// ── API response wrappers ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  count: number;
  lastKey?: string; // base64 for next page
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, string[]>;
}

// ── Todo DTOs ─────────────────────────────────────────────────────────────────
export type TodoDto = TodoEntity;
export type TodoListDto = PaginatedResponse<TodoDto>;

export interface TodoWithKeywordsDto extends TodoEntity {
  keywords: KeywordEntity[];
}

// ── Keyword DTOs ──────────────────────────────────────────────────────────────
export type KeywordDto = KeywordEntity;
export type KeywordListDto = KeywordEntity[];
