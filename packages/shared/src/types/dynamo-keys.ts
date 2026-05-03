/**
 * DynamoDB key helpers — single-table design.
 *
 * PK              | SK                            | GSI1PK         | GSI1SK
 * USER#<u>        | TODO#<id>                     | USER#<u>       | CREATED#<iso>
 * USER#<u>        | KEYWORD#<todoId>#<kwId>        | TODO#<todoId>  | KEYWORD#<kwId>
 * USER#<u>        | FAMILY#<familyId>              | USER#<u>       | SAVED#<iso>
 * USER#<u>        | VOCAB#<wordKey>                | USER#<u>       | VOCAB#<wordKey>
 */
export const Keys = {
  todo: {
    pk:     (userId: string)                   => `USER#${userId}`,
    sk:     (todoId: string)                   => `TODO#${todoId}`,
    gsi1pk: (userId: string)                   => `USER#${userId}`,
    gsi1sk: (createdAt: string)                => `CREATED#${createdAt}`,
  },
  keyword: {
    pk:     (userId: string)                   => `USER#${userId}`,
    sk:     (todoId: string, kwId: string)     => `KEYWORD#${todoId}#${kwId}`,
    gsi1pk: (todoId: string)                   => `TODO#${todoId}`,
    gsi1sk: (kwId: string)                     => `KEYWORD#${kwId}`,
  },
  wordFamily: {
    pk:     (userId: string)                   => `USER#${userId}`,
    sk:     (familyId: string)                 => `FAMILY#${familyId}`,
    gsi1pk: (userId: string)                   => `USER#${userId}`,
    gsi1sk: (savedAt: string)                  => `SAVED#${savedAt}`,
  },
  vocab: {
    pk:     (userId: string)                   => `USER#${userId}`,
    // VOCAB# prefix + normalised word key — gives alphabetical GSI1 scan for free
    sk:     (wordKey: string)                  => `VOCAB#${wordKey}`,
    gsi1pk: (userId: string)                   => `USER#${userId}`,
    gsi1sk: (wordKey: string)                  => `VOCAB#${wordKey}`,
  },
} as const;

/** "figure out" → "figure-out"  |  "List"  → "list" */
export function normalizeWordKey(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, '-');
}
