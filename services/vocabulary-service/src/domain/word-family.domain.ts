import { v4 as uuidv4 } from 'uuid';

import { WordFamilyEntity } from '@vocmap/shared';
import { SaveWordFamilyInput } from '@vocmap/shared';

export class WordFamilyDomain {
  /**
   * Factory: build a new WordFamilyEntity ready to persist.
   * Pure — no I/O, no side effects.
   */
  static create(
    userId: string,
    input: SaveWordFamilyInput,
  ): WordFamilyEntity {
    const now = new Date().toISOString();
    return {
      familyId: uuidv4(),
      userId,
      title: input.title.trim(),
      words: input.words,
      tags: input.tags,
      notes: input.notes,
      wordCount: input.words.length,
      savedAt: now,
      updatedAt: now,
    };
  }

  /**
   * Guard: caller must own the family.
   */
  static assertOwnership(family: WordFamilyEntity, userId: string): void {
    if (family.userId !== userId) {
      throw new Error('FORBIDDEN: user does not own this word family');
    }
  }
}
