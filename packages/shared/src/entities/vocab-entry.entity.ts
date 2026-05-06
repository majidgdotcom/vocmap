export interface VocabMeaning {
  type: string;    // e.g. "noun", "phrasal verb (past tense)"
  lang: string;    // ISO 639-2/3 code — "per", "en", "ar", "fr", …
  mean: string;
}

// ── Cambridge enrichment ──────────────────────────────────────────────────────

export interface CambridgeMeaning {
  mean: string;
  sentences: string[];
}

export interface CambridgeDefinition {
  wordType: string;
  means: CambridgeMeaning[];
}

export interface CambridgePhonetic {
  us?: string;
  uk?: string;
}

export interface CambridgeAudio {
  usKey?: string;   // S3 object key
  ukKey?: string;
}

export interface CambridgeData {
  phonetic:      CambridgePhonetic;
  audio:         CambridgeAudio;
  definitions:   CambridgeDefinition[];
  fetchedAt:     string;
  notAvailable?: boolean;
  checkedAt?:    string;
}

// ── Core entity ───────────────────────────────────────────────────────────────

/**
 * Global vocabulary entry — shared across all users.
 * Not user-scoped: anyone can read, only admins can write.
 */
export interface VocabEntry {
  vocabId:    string;
  wordKey:    string;       // "figure-out"
  word:       string;       // "figure out"
  means:      VocabMeaning[];
  relations:  string[];
  familyIds:  string[];     // which families contributed (reference only)
  cambridge?: CambridgeData;
  savedAt:    string;
  updatedAt:  string;
}
