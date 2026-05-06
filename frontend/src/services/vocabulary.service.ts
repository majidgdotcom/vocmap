import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vocabApi, vocabApiRaw } from '@/config/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VocabMeaning {
  type: string;
  lang: string;
  mean: string;
}

export interface CambridgeMeaning {
  mean: string;
  sentences: string[];
}

export interface CambridgeDefinition {
  wordType: string;
  means: CambridgeMeaning[];
}

export interface CambridgeData {
  phonetic:      { us?: string; uk?: string };
  audio:         { usKey?: string; ukKey?: string };
  definitions:   CambridgeDefinition[];
  fetchedAt:     string;
  notAvailable?: boolean;   // true when Cambridge has no entry for this word
  checkedAt?:    string;
}

export interface VocabEntry {
  vocabId:    string;
  wordKey:    string;
  word:       string;
  userId:     string;
  means:      VocabMeaning[];
  relations:  string[];
  familyIds:  string[];
  cambridge?: CambridgeData;
  savedAt:    string;
  updatedAt:  string;
}

interface VocabEnvelope {
  success: boolean;
  data: VocabEntry[];
  count: number;
  lastKey?: string;
}

// ── Audio URL helper ──────────────────────────────────────────────────────────

const AUDIO_BUCKET_URL = import.meta.env.VITE_AUDIO_BUCKET_URL as string;

export function getAudioUrl(key: string | undefined): string | undefined {
  if (!key || !AUDIO_BUCKET_URL) return undefined;
  return `${AUDIO_BUCKET_URL}/${key}`;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const vocabularyKeys = {
  all:   ['vocabulary'] as const,
  lists: ()                => [...vocabularyKeys.all, 'list'] as const,
  list:  (search?: string) => [...vocabularyKeys.lists(), { search }] as const,
};

// ── Infinite query ────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export function useInfiniteVocabulary(search?: string) {
  return useInfiniteQuery<VocabEnvelope, Error>({
    queryKey: vocabularyKeys.list(search),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (search)                        params.set('search',  search);
      if (typeof pageParam === 'string') params.set('lastKey', pageParam);
      return vocabApiRaw.get<VocabEnvelope>(`/vocabulary?${params}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.lastKey ?? undefined,
  });
}

// ── Enrichment mutation ───────────────────────────────────────────────────────

/**
 * POST /vocabulary/{wordKey}/enrich
 * Scrapes Cambridge for the word's phonetics, audio, and definitions,
 * uploads audio to S3, and merges the data back into the vocab entry.
 */
export function useEnrichVocabEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wordKey: string) =>
      vocabApi.post(`/vocabulary/${wordKey}/enrich`, {}),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: vocabularyKeys.lists() }),
  });
}
