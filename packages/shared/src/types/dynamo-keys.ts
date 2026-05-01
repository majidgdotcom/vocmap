/**
 * DynamoDB key helpers shared between services.
 *
 * Table design (single-table):
 *  PK              | SK                         | GSI1PK         | GSI1SK
 *  USER#<userId>   | TODO#<todoId>              | USER#<userId>  | CREATED#<iso>
 *  USER#<userId>   | KEYWORD#<todoId>#<kwId>    | TODO#<todoId>  | KEYWORD#<kwId>
 *  USER#<userId>   | FAMILY#<familyId>          | USER#<userId>  | SAVED#<iso>
 */
export const Keys = {
  todo: {
    pk: (userId: string) => `USER#${userId}`,
    sk: (todoId: string) => `TODO#${todoId}`,
    gsi1pk: (userId: string) => `USER#${userId}`,
    gsi1sk: (createdAt: string) => `CREATED#${createdAt}`,
  },
  keyword: {
    pk: (userId: string) => `USER#${userId}`,
    sk: (todoId: string, keywordId: string) => `KEYWORD#${todoId}#${keywordId}`,
    gsi1pk: (todoId: string) => `TODO#${todoId}`,
    gsi1sk: (keywordId: string) => `KEYWORD#${keywordId}`,
  },
  // ── vocabulary-service ───────────────────────────────────────────────────
  wordFamily: {
    pk: (userId: string) => `USER#${userId}`,
    sk: (familyId: string) => `FAMILY#${familyId}`,
    gsi1pk: (userId: string) => `USER#${userId}`,
    // SAVED# prefix is distinct from CREATED# and KEYWORD# — safe to share GSI1
    gsi1sk: (savedAt: string) => `SAVED#${savedAt}`,
  },
} as const;
