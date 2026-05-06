/**
 * Vocabulary ViewModel
 *
 * Pure presentation functions — no React, no I/O.
 * Transforms raw VocabEntry data into shapes the View consumes directly.
 */

import { VocabEntry, VocabMeaning, CambridgeDefinition } from '@/services/vocabulary.service';
import { getCategory } from '@/viewmodels/word-family.viewmodel';

// ── Types the View renders ────────────────────────────────────────────────────

export interface VocabularyViewModel {
  vocabId:       string;
  wordKey:       string;
  word:          string;
  savedDate:     string;             // "May 4, 2026"
  updatedDate:   string;
  familyCount:   number;
  means:         MeaningViewModel[];
  relations:     string[];
  cambridge?:    CambridgeViewModel;
  isEnriched:    boolean;
}

export interface MeaningViewModel {
  type:     string;
  category: string;
  lang:     string;
  mean:     string;
}

export interface CambridgeDefinitionViewModel {
  wordType:  string;
  category:  string;
  means: {
    mean:      string;
    sentences: string[];
  }[];
}

export interface CambridgeViewModel {
  ukPhonetic?:    string;           // /prəˈvaɪd/
  usPhonetic?:    string;
  ukAudioKey?:    string;           // S3 key
  usAudioKey?:    string;
  definitions:    CambridgeDefinitionViewModel[];
  fetchedDate:    string;           // "May 4, 2026"
  notAvailable:   boolean;          // true when Cambridge has no entry
  checkedDate?:   string;           // when notAvailable was last confirmed
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function toVocabularyViewModel(entry: VocabEntry): VocabularyViewModel {
  return {
    vocabId:     entry.vocabId,
    wordKey:     entry.wordKey,
    word:        entry.word,
    savedDate:   formatDate(entry.savedAt),
    updatedDate: formatDate(entry.updatedAt),
    familyCount: entry.familyIds.length,
    means:       entry.means.map(toMeaningViewModel),
    relations:   entry.relations,
    cambridge:   entry.cambridge ? toCambridgeViewModel(entry.cambridge) : undefined,
    isEnriched:  !!entry.cambridge,
  };
}

function toMeaningViewModel(m: VocabMeaning): MeaningViewModel {
  return {
    type:     m.type,
    category: getCategory(m.type),
    lang:     m.lang ?? 'per',
    mean:     m.mean,
  };
}

function toCambridgeViewModel(c: VocabEntry['cambridge']): CambridgeViewModel {
  if (!c) throw new Error('cambridge data is required');
  return {
    ukPhonetic:   c.phonetic?.uk,
    usPhonetic:   c.phonetic?.us,
    ukAudioKey:   c.audio?.ukKey,
    usAudioKey:   c.audio?.usKey,
    definitions:  (c.definitions ?? []).map((def: CambridgeDefinition) => ({
      wordType:  def.wordType,
      category:  getCategory(def.wordType),
      means:     def.means,
    })),
    fetchedDate:  c.fetchedAt ? formatDate(c.fetchedAt) : '',
    notAvailable: c.notAvailable ?? false,
    checkedDate:  c.checkedAt ? formatDate(c.checkedAt) : undefined,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

/**
 * Returns a short summary string for display in collapsed card headers.
 * Example: "فهرست، لیست · فهرست کردن"
 */
export function getMeansSummary(means: MeaningViewModel[]): string {
  return means.map(m => m.mean).join(' · ');
}

/**
 * Returns the unique set of categories present in a word's meanings.
 * Used to drive the type-badge display in card headers.
 */
export function getUniqueCategoryBadges(
  means: MeaningViewModel[],
): { category: string; type: string }[] {
  const seen = new Set<string>();
  return means.reduce<{ category: string; type: string }[]>((acc, m) => {
    const key = `${m.category}|${m.type}`;
    if (!seen.has(key)) { seen.add(key); acc.push({ category: m.category, type: m.type }); }
    return acc;
  }, []);
}
