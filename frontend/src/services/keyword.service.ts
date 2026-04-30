import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { KeywordEntity, AddKeywordsInput } from '@vocmap/shared';
import { keywordApi } from '@/config/api-client';

export const keywordKeys = {
  all: ['keywords'] as const,
  byTodo: (todoId: string) => [...keywordKeys.all, 'todo', todoId] as const,
  todosByKeyword: (keywordId: string) =>
    [...keywordKeys.all, 'todos-by-keyword', keywordId] as const,
};

export function useKeywords(todoId: string) {
  return useQuery({
    queryKey: keywordKeys.byTodo(todoId),
    queryFn: () => keywordApi.get<KeywordEntity[]>(`/todos/${todoId}/keywords`),
    enabled: !!todoId,
  });
}

export function useTodosByKeyword(keywordId: string) {
  return useQuery({
    queryKey: keywordKeys.todosByKeyword(keywordId),
    queryFn: () => keywordApi.get<KeywordEntity[]>(`/keywords/${keywordId}/todos`),
    enabled: !!keywordId,
  });
}

export function useAddKeywords(todoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddKeywordsInput) =>
      keywordApi.post<KeywordEntity[]>(`/todos/${todoId}/keywords`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keywordKeys.byTodo(todoId) }),
  });
}

export function useDeleteKeyword(todoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keywordId: string) =>
      keywordApi.delete(`/todos/${todoId}/keywords/${keywordId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keywordKeys.byTodo(todoId) }),
  });
}
