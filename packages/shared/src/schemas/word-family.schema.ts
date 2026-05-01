import { z } from 'zod';

// ── Single word entry ─────────────────────────────────────────────────────────
export const WordEntrySchema = z.object({
  word: z.string().min(1, 'word is required'),
  type: z.string().min(1, 'type is required'),
  typeCode: z.number().int().optional(),
  mean: z.string().min(1, 'mean is required'),
});

// ── One family payload (used inside the batch array) ─────────────────────────
export const SaveWordFamilySchema = z.object({
  title: z.string().min(1, 'title is required').max(200),
  words: z
    .array(WordEntrySchema)
    .min(1, 'words must not be empty')
    .max(200, 'max 200 words per family'),
  tags: z.array(z.string().max(50)).max(20).default([]),
  notes: z.string().max(1000).default(''),
});

// ── Batch request body (POST /word-families/batch) ────────────────────────────
export const BatchSaveFamiliesSchema = z.object({
  families: z
    .array(SaveWordFamilySchema)
    .min(1, 'families must not be empty')
    .max(50, 'max 50 families per batch'),
});

// ── Query params (GET /word-families) ────────────────────────────────────────
export const GetFamiliesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  lastKey: z.string().optional(),
  tag: z.string().optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────
export type WordEntryInput = z.infer<typeof WordEntrySchema>;
export type SaveWordFamilyInput = z.infer<typeof SaveWordFamilySchema>;
export type BatchSaveFamiliesInput = z.infer<typeof BatchSaveFamiliesSchema>;
export type GetFamiliesQuery = z.infer<typeof GetFamiliesQuerySchema>;
