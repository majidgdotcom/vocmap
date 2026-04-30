import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';

import {
  TodoEntity,
  TodoListDto,
  CreateTodoInput,
  UpdateTodoInput,
  GetTodosQuery,
} from '@vocmap/shared';
import { todoApi } from '@/config/api-client';

// ── Query keys ────────────────────────────────────────────────────────────────
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (query: Partial<GetTodosQuery>) => [...todoKeys.lists(), query] as const,
  detail: (todoId: string) => [...todoKeys.all, 'detail', todoId] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────
export function useTodos(query: Partial<GetTodosQuery> = {}): UseQueryResult<TodoListDto> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.keywordId) params.set('keywordId', query.keywordId);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.lastKey) params.set('lastKey', query.lastKey);

  return useQuery({
    queryKey: todoKeys.list(query),
    queryFn: () => todoApi.get<TodoListDto>(`/todos?${params.toString()}`),
  });
}

export function useTodo(todoId: string): UseQueryResult<TodoEntity> {
  return useQuery({
    queryKey: todoKeys.detail(todoId),
    queryFn: () => todoApi.get<TodoEntity>(`/todos/${todoId}`),
    enabled: !!todoId,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.post<TodoEntity>('/todos', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: todoKeys.lists() }),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, ...input }: UpdateTodoInput & { todoId: string }) =>
      todoApi.put<TodoEntity>(`/todos/${todoId}`, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: todoKeys.lists() });
      qc.setQueryData(todoKeys.detail(data.todoId), data);
    },
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (todoId: string) => todoApi.delete(`/todos/${todoId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: todoKeys.lists() }),
  });
}

export function useArchiveTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (todoId: string) => todoApi.post<TodoEntity>(`/todos/${todoId}/archive`, {}),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: todoKeys.lists() });
      qc.setQueryData(todoKeys.detail(data.todoId), data);
    },
  });
}
