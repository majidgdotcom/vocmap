import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publicVocabApiRaw, vocabApi } from '@/config/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VocabMeaning {
  type: string;
  lang: string;
  mean: string;
}

export interface CambridgeMeaning { mean: string; sentences: string[]; }
export interface CambridgeDefinition { wordType: string; means: CambridgeMeaning[]; }

export interface CambridgeData {
  phonetic:      { us?: string; uk?: string };
  audio:         { usKey?: string; ukKey?: string };
  definitions:   CambridgeDefinition[];
  fetchedAt:     string;
  notAvailable?: boolean;
  checkedAt?:    string;
}

export interface VocabEntry {
  vocabId:    string;
  wordKey:    string;
  word:       string;
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

const PAGE_SIZE = 50;

// ── Public infinite query (no auth) ──────────────────────────────────────────

export function useInfiniteVocabulary(search?: string) {
  return useInfiniteQuery<VocabEnvelope, Error>({
    queryKey: vocabularyKeys.list(search),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (search)                        params.set('search',  search);
      if (typeof pageParam === 'string') params.set('lastKey', pageParam);
      // Uses unauthenticated client — public endpoint
      return publicVocabApiRaw.get<VocabEnvelope>(`/vocabulary?${params}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.lastKey ?? undefined,
  });
}

// ── Admin-only mutations ──────────────────────────────────────────────────────

/** POST /vocabulary/{wordKey}/enrich — admin only */
export function useEnrichVocabEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wordKey: string) => vocabApi.post(`/vocabulary/${wordKey}/enrich`, {}),
    onSuccess:  () => qc.invalidateQueries({ queryKey: vocabularyKeys.lists() }),
  });
}
