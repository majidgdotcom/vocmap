export interface VocabMeaning {
  type: string;
  lang: string;   // "per", "en", "ar", "fr", …
  mean: string;
}

// ── Cambridge enrichment ──────────────────────────────────────────────────────

export interface CambridgeMeaning {
  mean: string;
  sentences: string[];
}

export interface CambridgeDefinition {
  wordType: string;   // "noun", "verb", …
  means: CambridgeMeaning[];
}

export interface CambridgePhonetic {
  us?: string;   // /prəˈvaɪd/
  uk?: string;   // /prəˈvaɪd/
}

export interface CambridgeAudio {
  usKey?: string;   // S3 object key  e.g. "audio/provide-us.mp3"
  ukKey?: string;   // S3 object key  e.g. "audio/provide-uk.mp3"
}

export interface CambridgeData {
  phonetic:    CambridgePhonetic;
  audio:       CambridgeAudio;
  definitions: CambridgeDefinition[];
  fetchedAt:   string;   // ISO 8601
}

// ── Core entity ───────────────────────────────────────────────────────────────

export interface VocabEntry {
  vocabId:    string;
  wordKey:    string;       // "figure-out"
  word:       string;       // "figure out"
  userId:     string;
  means:      VocabMeaning[];
  relations:  string[];
  familyIds:  string[];
  cambridge?: CambridgeData;   // populated after enrichment
  savedAt:    string;
  updatedAt:  string;
}
