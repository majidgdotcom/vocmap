/**
 * DynamoDB key helpers — single-table design.
 *
 * PK                | SK                            | GSI1PK         | GSI1SK
 * USER#<u>          | FAMILY#<familyId>             | USER#<u>       | SAVED#<iso>
 * VOCAB             | VOCAB#<wordKey>               | VOCAB          | VOCAB#<wordKey>
 *
 * Note: Vocabulary is a shared global resource — no userId in PK.
 * Word families remain user-scoped.
 */
export const Keys = {
  wordFamily: {
    pk:     (userId: string)    => `USER#${userId}`,
    sk:     (familyId: string)  => `FAMILY#${familyId}`,
    gsi1pk: (userId: string)    => `USER#${userId}`,
    gsi1sk: (savedAt: string)   => `SAVED#${savedAt}`,
  },
  vocab: {
    // Global partition — all vocabulary words share PK="VOCAB"
    pk:     ()                  => 'VOCAB',
    sk:     (wordKey: string)   => `VOCAB#${wordKey}`,
    gsi1pk: ()                  => 'VOCAB',
    gsi1sk: (wordKey: string)   => `VOCAB#${wordKey}`,
  },
} as const;

/** "figure out" → "figure-out"  |  "List" → "list" */
export function normalizeWordKey(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, '-');
}
