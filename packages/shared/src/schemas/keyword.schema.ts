import { z } from 'zod';

// ── Base ──────────────────────────────────────────────────────────────────────
export const KeywordSchema = z.object({
  keywordId: z.string().uuid(),
  todoId: z.string().uuid(),
  userId: z.string().min(1),
  label: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
    .optional(),
  createdAt: z.string().datetime(),
});

// ── Request schemas ───────────────────────────────────────────────────────────
export const AddKeywordSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const AddKeywordsSchema = z.object({
  keywords: z.array(AddKeywordSchema).min(1).max(20),
});

export const DeleteKeywordSchema = z.object({
  keywordId: z.string().uuid(),
});

// ── Types ─────────────────────────────────────────────────────────────────────
export type AddKeywordInput = z.infer<typeof AddKeywordSchema>;
export type AddKeywordsInput = z.infer<typeof AddKeywordsSchema>;
