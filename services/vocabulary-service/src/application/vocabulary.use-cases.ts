import { VocabEntry } from '@vocmap/shared';
import { GetVocabQuery } from '@vocmap/shared';

import { VocabularyDomain } from '../domain/vocabulary.domain';
import {
  IVocabularyRepository,
  PaginatedVocab,
} from './vocabulary.repository.interface';

interface RawWordEntry {
  word: string;
  type: string;
  mean: string;
}

export class VocabularyUseCases {
  constructor(private readonly repo: IVocabularyRepository) {}

  /**
   * Transform a word-family's words into vocabulary entries and upsert them.
   * Returns the final (merged) entries.
   */
  async saveFamilyToVocab(
    userId: string,
    familyId: string,
    words: RawWordEntry[],
  ): Promise<VocabEntry[]> {
    const incoming = VocabularyDomain.fromFamily(userId, familyId, words);
    return this.repo.upsertMany(incoming);
  }

  async listVocab(
    userId: string,
    query: GetVocabQuery,
  ): Promise<PaginatedVocab> {
    return this.repo.findByUser(userId, query);
  }

  async getWord(
    userId: string,
    wordKey: string,
  ): Promise<VocabEntry | null> {
    return this.repo.findByWordKey(userId, wordKey);
  }
}

export class VocabNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(wordKey: string) {
    super(`Vocabulary word "${wordKey}" not found`);
    this.name = 'VocabNotFoundError';
  }
}
