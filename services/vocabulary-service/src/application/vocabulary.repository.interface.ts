import { VocabEntry } from '@vocmap/shared';
import { GetVocabQuery } from '@vocmap/shared';

export interface PaginatedVocab {
  items: VocabEntry[];
  lastKey?: string;
}

export interface IVocabularyRepository {
  /** Get a single word by its key. */
  findByWordKey(wordKey: string): Promise<VocabEntry | null>;

  /** Upsert many — create new or merge into existing. */
  upsertMany(entries: VocabEntry[]): Promise<VocabEntry[]>;

  /** Paginated alphabetical list (public). */
  list(query: GetVocabQuery): Promise<PaginatedVocab>;

  /** Hard delete. */
  delete(wordKey: string): Promise<void>;
}
