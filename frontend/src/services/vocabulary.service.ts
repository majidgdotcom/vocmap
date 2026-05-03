import { useInfiniteQuery } from '@tanstack/react-query';
import { vocabApiRaw } from '@/config/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VocabMeaning {
  type: string;
  mean: string;
}

export interface VocabEntry {
  vocabId:   string;
  wordKey:   string;    // "figure-out"
  word:      string;    // "figure out"
  userId:    string;
  means:     VocabMeaning[];
  relations: string[];  // display words
  familyIds: string[];
  savedAt:   string;
  updatedAt: string;
}

interface VocabEnvelope {
  success: boolean;
  data: VocabEntry[];
  count: number;
  lastKey?: string;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const vocabularyKeys = {
  all:    ['vocabulary'] as const,
  lists:  ()               => [...vocabularyKeys.all, 'list'] as const,
  list:   (search?: string) => [...vocabularyKeys.lists(), { search }] as const,
};

// ── Infinite query (alphabetical, A → Z) ──────────────────────────────────────

const PAGE_SIZE = 50;

export function useInfiniteVocabulary(search?: string) {
  return useInfiniteQuery<VocabEnvelope, Error>({
    queryKey: vocabularyKeys.list(search),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (search)                            params.set('search',  search);
      if (typeof pageParam === 'string')     params.set('lastKey', pageParam);
      return vocabApiRaw.get<VocabEnvelope>(`/vocabulary?${params}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.lastKey ?? undefined,
  });
}
