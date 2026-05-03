import { z } from 'zod';

// ── POST /vocabulary/from-family/{familyId} ───────────────────────────────────
// Body is empty — familyId comes from path, userId from JWT.
// Keeping schema here for any future body fields.
export const SaveFamilyToVocabSchema = z.object({}).strict();

// ── GET /vocabulary query params ──────────────────────────────────────────────
export const GetVocabQuerySchema = z.object({
  limit:   z.coerce.number().min(1).max(100).default(50),
  lastKey: z.string().optional(),
  search:  z.string().max(100).optional(),
});

export type GetVocabQuery = z.infer<typeof GetVocabQuerySchema>;
