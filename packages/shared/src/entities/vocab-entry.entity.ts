export interface VocabMeaning {
  type: string;    // e.g. "noun", "phrasal verb (past tense)"
  lang: string;    // ISO 639-2/3 code — "per", "en", "ar", "fr", …
  mean: string;    // translation in that language
}

/**
 * A single vocabulary word, potentially contributed by multiple word families.
 *
 * "figure out" → wordKey = "figure-out"
 * "list"       → wordKey = "list"
 */
export interface VocabEntry {
  vocabId:   string;
  wordKey:   string;       // normalised: lower-case, spaces→hyphens
  word:      string;       // display form
  userId:    string;
  means:     VocabMeaning[];  // deduplicated by type+lang pair
  relations: string[];
  familyIds: string[];
  savedAt:   string;
  updatedAt: string;
}
