import { VocabEntry } from '@vocmap/shared';
import { GetVocabQuery } from '@vocmap/shared';

export interface PaginatedVocab {
  items: VocabEntry[];
  lastKey?: string;
}

export interface IVocabularyRepository {
  /** Get a single word by its key (returns null if not found). */
  findByWordKey(userId: string, wordKey: string): Promise<VocabEntry | null>;

  /**
   * Upsert many entries:
   *  - If entry does not exist → create
   *  - If entry exists         → merge (means dedup by type, relations set-union)
   * Returns the final persisted entries.
   */
  upsertMany(entries: VocabEntry[]): Promise<VocabEntry[]>;

  /** Paginated alphabetical list. */
  findByUser(userId: string, query: GetVocabQuery): Promise<PaginatedVocab>;

  /** Hard delete a single word entry. */
  delete(userId: string, wordKey: string): Promise<void>;
}
