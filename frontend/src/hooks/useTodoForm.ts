import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { CreateTodoSchema, AddKeywordsSchema } from '@vocmap/shared';

// Extended schema that includes inline keywords on creation
const CreateTodoWithKeywordsSchema = CreateTodoSchema.extend({
  keywords: z
    .array(
      z.object({
        label: z.string().min(1, 'Label is required').max(50),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional()
          .or(z.literal('')),
      }),
    )
    .optional()
    .default([]),
});

export type CreateTodoWithKeywordsForm = z.infer<typeof CreateTodoWithKeywordsSchema>;

export function useTodoForm(defaultValues?: Partial<CreateTodoWithKeywordsForm>) {
  const form = useForm<CreateTodoWithKeywordsForm>({
    resolver: zodResolver(CreateTodoWithKeywordsSchema),
    defaultValues: {
      title: '',
      description: '',
      keywords: [],
      ...defaultValues,
    },
  });

  const keywordsFieldArray = useFieldArray({
    control: form.control,
    name: 'keywords',
  });

  return { form, keywordsFieldArray };
}

// ── Separate hook for adding keywords to existing todo ────────────────────────
const AddKeywordsFormSchema = AddKeywordsSchema;
type AddKeywordsForm = z.infer<typeof AddKeywordsFormSchema>;

export function useAddKeywordsForm() {
  const form = useForm<AddKeywordsForm>({
    resolver: zodResolver(AddKeywordsFormSchema),
    defaultValues: { keywords: [{ label: '', color: '' }] },
  });

  const keywordsFieldArray = useFieldArray({
    control: form.control,
    name: 'keywords',
  });

  return { form, keywordsFieldArray };
}
