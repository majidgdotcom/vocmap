import { VocabEntry } from '@vocmap/shared';
import { GetVocabQuery } from '@vocmap/shared';

import { VocabularyDomain } from '../domain/vocabulary.domain';
import { IVocabularyRepository, PaginatedVocab } from './vocabulary.repository.interface';

interface RawWordEntry { word: string; type: string; lang?: string; mean: string; }

export class VocabularyUseCases {
  constructor(private readonly repo: IVocabularyRepository) {}

  async saveFamilyToVocab(
    familyId: string,
    words: RawWordEntry[],
  ): Promise<VocabEntry[]> {
    const incoming = VocabularyDomain.fromFamily(familyId, words);
    return this.repo.upsertMany(incoming);
  }

  async listVocab(query: GetVocabQuery): Promise<PaginatedVocab> {
    return this.repo.list(query);
  }

  async getWord(wordKey: string): Promise<VocabEntry | null> {
    return this.repo.findByWordKey(wordKey);
  }
}

export class VocabNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(wordKey: string) {
    super(`Vocabulary word "${wordKey}" not found`);
    this.name = 'VocabNotFoundError';
  }
}
