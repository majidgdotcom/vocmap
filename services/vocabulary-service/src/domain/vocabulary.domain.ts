import { v4 as uuidv4 } from 'uuid';

import { VocabEntry, VocabMeaning } from '@vocmap/shared';
import { normalizeWordKey } from '@vocmap/shared';

interface RawWordEntry {
  word: string;
  type: string;
  mean: string;
}

export class VocabularyDomain {
  /**
   * Transform a flat word-family array into VocabEntry[] ready for upsert.
   *
   * Rules:
   *  • Group rows by normalised word key — multiple rows for the same word
   *    (e.g. "list" as noun + verb) collapse into one entry with multiple means.
   *  • relations = every OTHER word in the family (display form, deduped).
   *  • familyId is recorded so we can mark the family as saved.
   */
  static fromFamily(
    userId: string,
    familyId: string,
    words: RawWordEntry[],
  ): VocabEntry[] {
    const now = new Date().toISOString();

    // 1. Collect unique display words (preserves first occurrence casing)
    const allDisplayWords = Array.from(
      new Map(words.map(w => [normalizeWordKey(w.word), w.word])).values(),
    );

    // 2. Group means by word key
    const grouped = new Map<string, { word: string; means: VocabMeaning[] }>();
    for (const row of words) {
      const key = normalizeWordKey(row.word);
      if (!grouped.has(key)) {
        grouped.set(key, { word: row.word, means: [] });
      }
      const entry = grouped.get(key)!;
      // Dedup means by type within this family
      if (!entry.means.some(m => m.type === row.type)) {
        entry.means.push({ type: row.type, mean: row.mean });
      }
    }

    // 3. Build VocabEntry per word
    const entries: VocabEntry[] = [];
    for (const [wordKey, { word, means }] of grouped) {
      const relations = allDisplayWords.filter(
        w => normalizeWordKey(w) !== wordKey,
      );
      entries.push({
        vocabId:   uuidv4(),
        wordKey,
        word,
        userId,
        means,
        relations,
        familyIds: [familyId],
        savedAt:   now,
        updatedAt: now,
      });
    }

    return entries;
  }

  /**
   * Merge an incoming entry (from a new family) into an existing persisted entry.
   * Returns the merged result — caller persists it.
   */
  static merge(existing: VocabEntry, incoming: VocabEntry): VocabEntry {
    // means: add any type not already present
    const existingTypes = new Set(existing.means.map(m => m.type));
    const newMeans = incoming.means.filter(m => !existingTypes.has(m.type));

    // relations: set union (keep display words, dedup by normalised key)
    const relMap = new Map<string, string>();
    for (const r of [...existing.relations, ...incoming.relations]) {
      relMap.set(normalizeWordKey(r), r);
    }
    // remove self
    relMap.delete(existing.wordKey);

    // familyIds: set union
    const familySet = new Set([...existing.familyIds, ...incoming.familyIds]);

    return {
      ...existing,
      means:     [...existing.means, ...newMeans],
      relations: Array.from(relMap.values()),
      familyIds: Array.from(familySet),
      updatedAt: new Date().toISOString(),
    };
  }
}
