import { v4 as uuidv4 } from 'uuid';
import { VocabEntry, VocabMeaning } from '@vocmap/shared';
import { normalizeWordKey } from '@vocmap/shared';

interface RawWordEntry {
  word:  string;
  type:  string;
  lang?: string;
  mean:  string;
}

export class VocabularyDomain {
  /**
   * Transform a flat word-family array into VocabEntry[] ready for upsert.
   * No userId — vocabulary is a shared global resource.
   */
  static fromFamily(
    familyId: string,
    words:    RawWordEntry[],
  ): VocabEntry[] {
    const now = new Date().toISOString();

    const allDisplayWords = Array.from(
      new Map(words.map(w => [normalizeWordKey(w.word), w.word])).values(),
    );

    const grouped = new Map<string, { word: string; means: VocabMeaning[] }>();
    for (const row of words) {
      const key  = normalizeWordKey(row.word);
      const lang = row.lang ?? 'per';
      if (!grouped.has(key)) grouped.set(key, { word: row.word, means: [] });
      const entry = grouped.get(key)!;
      if (!entry.means.some(m => m.type === row.type && m.lang === lang)) {
        entry.means.push({ type: row.type, lang, mean: row.mean });
      }
    }

    return Array.from(grouped.entries()).map(([wordKey, { word, means }]) => ({
      vocabId:   uuidv4(),
      wordKey,
      word,
      means,
      relations: allDisplayWords.filter(w => normalizeWordKey(w) !== wordKey),
      familyIds: [familyId],
      savedAt:   now,
      updatedAt: now,
    }));
  }

  /**
   * Merge an incoming entry into an existing one.
   * Deduplicates means by type+lang pair.
   */
  static merge(existing: VocabEntry, incoming: VocabEntry): VocabEntry {
    const existingPairs = new Set(
      existing.means.map(m => `${m.type}|${m.lang ?? 'per'}`),
    );
    const newMeans = incoming.means.filter(
      m => !existingPairs.has(`${m.type}|${m.lang ?? 'per'}`),
    );

    const relMap = new Map<string, string>();
    for (const r of [...existing.relations, ...incoming.relations]) {
      relMap.set(normalizeWordKey(r), r);
    }
    relMap.delete(existing.wordKey);

    return {
      ...existing,
      means:     [...existing.means, ...newMeans],
      relations: Array.from(relMap.values()),
      familyIds: Array.from(new Set([...existing.familyIds, ...incoming.familyIds])),
      updatedAt: new Date().toISOString(),
    };
  }
}
