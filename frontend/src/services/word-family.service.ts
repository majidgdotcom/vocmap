import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wordFamilyApi, wordFamilyApiRaw, vocabApi } from '@/config/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WordEntryInput {
  word: string;
  type: string;
  typeCode?: number;
  lang?: string;   // "per", "en", "ar", "fr", …
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
  savedToVocabulary?: boolean;
}

interface FamiliesEnvelope {
  success: boolean;
  data: WordFamilyEntity[];
  count: number;
  lastKey?: string;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const wordFamilyKeys = {
  all:   ['wordFamilies'] as const,
  lists: ()             => [...wordFamilyKeys.all, 'list'] as const,
  list:  (tag?: string) => [...wordFamilyKeys.lists(), { tag }] as const,
};

// ── Infinite query (word-family-service) ──────────────────────────────────────

const PAGE_SIZE = 50;

export function useInfiniteWordFamilies(tag?: string) {
  return useInfiniteQuery<FamiliesEnvelope, Error>({
    queryKey: wordFamilyKeys.list(tag),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (tag) params.set('tag', tag);
      if (typeof pageParam === 'string') params.set('lastKey', pageParam);
      return wordFamilyApiRaw.get<FamiliesEnvelope>(`/word-families?${params}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.lastKey ?? undefined,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** POST /word-families/batch → word-family-service */
export function useBatchSaveFamilies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BatchSaveFamiliesInput) =>
      wordFamilyApi.post<WordFamilyEntity[]>('/word-families/batch', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: wordFamilyKeys.lists() }),
  });
}

/** DELETE /word-families/{familyId} → word-family-service */
export function useDeleteWordFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (familyId: string) =>
      wordFamilyApi.delete(`/word-families/${familyId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: wordFamilyKeys.lists() }),
  });
}

/**
 * POST /vocabulary/from-family/{familyId} → vocabulary-service
 * Reads the family from DynamoDB, upserts its words into vocabulary,
 * and marks the family as savedToVocabulary = true.
 */
export function useSaveFamilyToVocab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (familyId: string) =>
      vocabApi.post(`/vocabulary/from-family/${familyId}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: wordFamilyKeys.lists() });
      qc.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });
}
