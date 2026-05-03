import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vocabApi } from '@/config/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WordEntryInput {
  word: string;
  type: string;
  typeCode?: number;
  mean: string;
}

export interface SaveWordFamilyInput {
  title: string;
  words: WordEntryInput[];
  tags: string[];
  notes: string;
}

export interface BatchSaveFamiliesInput {
  families: SaveWordFamilyInput[];
}

export interface WordFamilyEntity {
  familyId: string;
  userId: string;
  title: string;
  words: WordEntryInput[];
  tags: string[];
  notes: string;
  wordCount: number;
  savedAt: string;
  updatedAt: string;
}

export interface WordFamilyListResult {
  items: WordFamilyEntity[];
  count: number;
  lastKey?: string;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const wordFamilyKeys = {
  all:   ['wordFamilies'] as const,
  lists: () => [...wordFamilyKeys.all, 'list'] as const,
  list:  (tag?: string) => [...wordFamilyKeys.lists(), { tag }] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

export function useWordFamilies(tag?: string) {
  const params = new URLSearchParams({ limit: '50' });
  if (tag) params.set('tag', tag);

  return useQuery({
    queryKey: wordFamilyKeys.list(tag),
    queryFn:  () => vocabApi.get<WordFamilyEntity[]>(`/word-families?${params}`),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useBatchSaveFamilies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BatchSaveFamiliesInput) =>
      vocabApi.post<WordFamilyEntity[]>('/word-families/batch', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: wordFamilyKeys.lists() }),
  });
}

export function useDeleteWordFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (familyId: string) => vocabApi.delete(`/word-families/${familyId}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: wordFamilyKeys.lists() }),
  });
}
