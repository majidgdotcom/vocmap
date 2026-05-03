export interface VocabMeaning {
  type: string;   // e.g. "noun", "phrasal verb (past tense)"
  mean: string;   // Persian translation
}

/**
 * A single vocabulary word, potentially contributed by multiple word families.
 *
 * "figure out" → wordKey = "figure-out"
 * "list"       → wordKey = "list"
 */
export interface VocabEntry {
  vocabId:   string;       // uuid — stable ID
  wordKey:   string;       // normalised: lower-case, spaces→hyphens  e.g. "figure-out"
  word:      string;       // display form                             e.g. "figure out"
  userId:    string;
  means:     VocabMeaning[];  // deduplicated by `type`
  relations: string[];        // display words of related forms
  familyIds: string[];        // which WordFamily records contributed
  savedAt:   string;          // ISO 8601 — first save
  updatedAt: string;          // ISO 8601 — last merge
}
