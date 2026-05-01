// A single inflected form / derived word within a family
export interface WordEntry {
  word: string;
  type: string;
  typeCode?: number;
  mean: string;
}

// Persisted word-family record
export interface WordFamilyEntity {
  familyId: string;   // uuid
  userId: string;     // Cognito sub
  title: string;      // e.g. '"provide" family'
  words: WordEntry[];
  tags: string[];
  notes: string;
  wordCount: number;
  savedAt: string;    // ISO 8601
  updatedAt: string;
}
