import { z } from 'zod';

import { TodoStatus } from '../entities/todo.entity';

// ── Base ──────────────────────────────────────────────────────────────────────
export const TodoStatusSchema = z.nativeEnum(TodoStatus);

export const TodoSchema = z.object({
  todoId: z.string().uuid(),
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: TodoStatusSchema,
  keywordIds: z.array(z.string().uuid()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archivedAt: z.string().datetime().optional(),
});

// ── Request schemas ───────────────────────────────────────────────────────────
export const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
});

export const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: TodoStatusSchema.optional(),
});

export const ArchiveTodoSchema = z.object({
  todoId: z.string().uuid(),
});

export const GetTodosQuerySchema = z.object({
  status: TodoStatusSchema.optional(),
  keywordId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  lastKey: z.string().optional(), // base64-encoded DynamoDB LastEvaluatedKey
});

// ── Types inferred from schemas ───────────────────────────────────────────────
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
export type GetTodosQuery = z.infer<typeof GetTodosQuerySchema>;
