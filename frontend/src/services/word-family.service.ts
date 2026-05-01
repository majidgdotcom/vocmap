import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';

import {
  WordFamilyEntity,
  BatchSaveFamiliesInput,
  GetFamiliesQuery,
} from '@vocmap/shared';

import { vocabApi } from '@/config/api-client';

// ── Response shape from the API ───────────────────────────────────────────────
interface WordFamilyListDto {
  items: WordFamilyEntity[];
  count: number;
  lastKey?: string;
}

interface BatchSaveResult {
  data: WordFamilyEntity[];
  count: number;
}

// ── Query keys ────────────────────────────────────────────────────────────────
export const wordFamilyKeys = {
  all: ['wordFamilies'] as const,
  lists: () => [...wordFamilyKeys.all, 'list'] as const,
  list: (query: Partial<GetFamiliesQuery>) =>
    [...wordFamilyKeys.lists(), query] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────
export function useWordFamilies(
  query: Partial<GetFamiliesQuery> = {},
): UseQueryResult<WordFamilyListDto> {
  const params = new URLSearchParams();
  if (query.limit) params.set('limit', String(query.limit));
  if (query.lastKey) params.set('lastKey', query.lastKey);
  if (query.tag) params.set('tag', query.tag);

  return useQuery({
    queryKey: wordFamilyKeys.list(query),
    queryFn: () =>
      vocabApi.get<WordFamilyListDto>(`/word-families?${params.toString()}`),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Send all valid word-family blocks to POST /word-families/batch.
 * Invalidates the list query on success so the Vocabulary Map refreshes.
 */
export function useBatchSaveFamilies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BatchSaveFamiliesInput) =>
      vocabApi.post<BatchSaveResult>('/word-families/batch', input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: wordFamilyKeys.lists() }),
  });
}

export function useDeleteWordFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (familyId: string) =>
      vocabApi.delete(`/word-families/${familyId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: wordFamilyKeys.lists() }),
  });
}
