import React from 'react';

import { useTodoForm } from '@/hooks/useTodoForm';
import { useCreateTodo } from '@/services/todo.service';
import { useAddKeywords } from '@/services/keyword.service';

interface CreateTodoModalProps {
  onClose: () => void;
}

export const CreateTodoModal: React.FC<CreateTodoModalProps> = ({ onClose }) => {
  const { form, keywordsFieldArray } = useTodoForm();
  const createTodo = useCreateTodo();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;
  const { fields, append, remove } = keywordsFieldArray;

  const onSubmit = handleSubmit(async (data) => {
    const todo = await createTodo.mutateAsync({
      title: data.title,
      description: data.description,
    });

    if (data.keywords && data.keywords.length > 0) {
      const validKeywords = data.keywords.filter((k) => k.label.trim().length > 0);
      if (validKeywords.length > 0) {
        // Re-create addKeywords hook logic for the new todoId
        const { keywordApi } = await import('@/config/api-client');
        await keywordApi.post(`/todos/${todo.todoId}/keywords`, {
          keywords: validKeywords.map((k) => ({ label: k.label, color: k.color || undefined })),
        });
      }
    }

    onClose();
  });

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>New Todo</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input {...register('title')} style={inputStyle} placeholder="What needs to be done?" />
            {errors.title && <FieldError message={errors.title.message!} />}
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              {...register('description')}
              style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
              placeholder="Add details…"
            />
          </div>

          {/* Keywords (useFieldArray) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={labelStyle}>Keywords</label>
              <button
                type="button"
                onClick={() => append({ label: '', color: '' })}
                style={addKwBtnStyle}
              >
                + Add
              </button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  {...register(`keywords.${index}.label`)}
                  placeholder="Label"
                  style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                />
                <input
                  {...register(`keywords.${index}.color`)}
                  type="color"
                  style={{ width: '36px', height: '36px', padding: '2px', cursor: 'pointer', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  style={{ ...closeBtnStyle, fontSize: '16px' }}
                >
                  ✕
                </button>
              </div>
            ))}
            {errors.keywords && <FieldError message="One or more keyword labels are invalid" />}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={submitBtnStyle}>
              {isSubmitting ? 'Creating…' : 'Create Todo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FieldError: React.FC<{ message: string }> = ({ message }) => (
  <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{message}</p>
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', padding: '28px',
  width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#374151',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
  borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box',
};
const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '18px',
};
const addKwBtnStyle: React.CSSProperties = {
  fontSize: '12px', padding: '2px 10px', border: '1px solid #6366f1',
  background: '#eef2ff', color: '#6366f1', borderRadius: '4px', cursor: 'pointer',
};
const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: '6px',
  background: '#fff', cursor: 'pointer', fontSize: '14px',
};
const submitBtnStyle: React.CSSProperties = {
  padding: '8px 24px', border: 'none', borderRadius: '6px',
  background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
};
