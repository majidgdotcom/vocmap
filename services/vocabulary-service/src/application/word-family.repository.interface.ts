import { WordFamilyEntity } from '@vocmap/shared';
import { GetFamiliesQuery } from '@vocmap/shared';

export interface PaginatedResult<T> {
  items: T[];
  lastKey?: string; // base64-encoded DynamoDB LastEvaluatedKey
}

export interface IWordFamilyRepository {
  /** Batch-write multiple families atomically (chunks of 25). */
  saveBatch(families: WordFamilyEntity[]): Promise<WordFamilyEntity[]>;

  /** Paginated list of a user's families, newest first (GSI1). */
  findByUser(
    userId: string,
    query: GetFamiliesQuery,
  ): Promise<PaginatedResult<WordFamilyEntity>>;

  /** Single family by composite key. */
  findById(
    userId: string,
    familyId: string,
  ): Promise<WordFamilyEntity | null>;

  /** Hard delete. */
  delete(userId: string, familyId: string): Promise<void>;
}
