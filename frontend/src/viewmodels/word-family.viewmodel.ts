/**
 * Word Family ViewModel
 *
 * Pure presentation functions — no React, no I/O.
 * Transforms raw WordFamilyEntity data into shapes the View consumes directly.
 */

import { WordFamilyEntity, WordEntryInput } from '@/services/word-family.service';

// ── Types the View renders ────────────────────────────────────────────────────

export interface WordFamilyViewModel {
  familyId: string;
  title: string;
  wordCount: number;
  tags: string[];
  notes: string;
  savedDate: string;           // "May 4, 2026"
  categoryDistribution: CategoryCount[];
  isSavedToVocabulary: boolean;
  words: WordEntryViewModel[];
}

export interface WordEntryViewModel {
  word: string;
  type: string;
  typeCode?: number | string;
  lang: string;
  mean: string;
  category: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

// ── Category helpers ──────────────────────────────────────────────────────────

export function getCategory(type: string): string {
  const t = type.toLowerCase();
  if (t.startsWith('noun'))                                                        return 'noun';
  if (t.startsWith('verb') || t.includes('gerund') || t.includes('participle') ||
      t.includes('past tense') || t.includes('present continuous'))               return 'verb';
  if (t.startsWith('adjective') || t.startsWith('adj'))                           return 'adjective';
  if (t.startsWith('adverb') || t.startsWith('adverbial'))                        return 'adverb';
  if (t.startsWith('conjunction'))                                                 return 'conjunction';
  if (t.startsWith('preposition') || t.startsWith('prepositional'))               return 'preposition';
  if (t.startsWith('pronoun'))                                                     return 'pronoun';
  if (t.startsWith('phrasal'))                                                     return 'phrasal';
  if (t.includes('phrase') || t === 'idiom')                                       return 'phrase';
  return 'other';
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function toWordFamilyViewModel(entity: WordFamilyEntity): WordFamilyViewModel {
  const words = entity.words.map(toWordEntryViewModel);

  // Build category distribution in insertion order
  const dist = new Map<string, number>();
  words.forEach(w => dist.set(w.category, (dist.get(w.category) ?? 0) + 1));
  const categoryDistribution: CategoryCount[] = Array.from(dist.entries()).map(
    ([category, count]) => ({ category, count }),
  );

  return {
    familyId:            entity.familyId,
    title:               entity.title,
    wordCount:           entity.wordCount ?? entity.words.length,
    tags:                entity.tags,
    notes:               entity.notes,
    savedDate:           formatDate(entity.savedAt),
    categoryDistribution,
    isSavedToVocabulary: entity.savedToVocabulary ?? false,
    words,
  };
}

export function toWordEntryViewModel(entry: WordEntryInput): WordEntryViewModel {
  return {
    word:     entry.word,
    type:     entry.type,
    typeCode: entry.typeCode,
    lang:     entry.lang ?? 'per',
    mean:     entry.mean,
    category: getCategory(entry.type),
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
