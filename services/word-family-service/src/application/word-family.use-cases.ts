import { WordFamilyEntity } from '@vocmap/shared';
import { BatchSaveFamiliesInput, GetFamiliesQuery } from '@vocmap/shared';

import { WordFamilyDomain } from '../domain/word-family.domain';
import {
  IWordFamilyRepository,
  PaginatedResult,
} from './word-family.repository.interface';

export class WordFamilyUseCases {
  constructor(private readonly repo: IWordFamilyRepository) {}

  /**
   * Build entities from each input payload, then batch-write all of them.
   * Returns the persisted records in the same order.
   */
  async saveBatch(
    userId: string,
    input: BatchSaveFamiliesInput,
  ): Promise<WordFamilyEntity[]> {
    const entities = input.families.map((f) =>
      WordFamilyDomain.create(userId, f),
    );
    return this.repo.saveBatch(entities);
  }

  async listFamilies(
    userId: string,
    query: GetFamiliesQuery,
  ): Promise<PaginatedResult<WordFamilyEntity>> {
    return this.repo.findByUser(userId, query);
  }

  async deleteFamily(userId: string, familyId: string): Promise<void> {
    const family = await this.repo.findById(userId, familyId);
    if (!family) throw new WordFamilyNotFoundError(familyId);
    WordFamilyDomain.assertOwnership(family, userId);
    await this.repo.delete(userId, familyId);
  }
}

export class WordFamilyNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(familyId: string) {
    super(`Word family ${familyId} not found`);
    this.name = 'WordFamilyNotFoundError';
  }
}
