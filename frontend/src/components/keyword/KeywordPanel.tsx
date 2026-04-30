import React from 'react';

import { KeywordEntity } from '@vocmap/shared';
import { useKeywords, useAddKeywords, useDeleteKeyword } from '@/services/keyword.service';
import { useAddKeywordsForm } from '@/hooks/useTodoForm';

interface KeywordPanelProps {
  todoId: string;
  onClose: () => void;
}

export const KeywordPanel: React.FC<KeywordPanelProps> = ({ todoId, onClose }) => {
  const { data: keywords = [], isLoading } = useKeywords(todoId);
  const addKeywords = useAddKeywords(todoId);
  const deleteKeyword = useDeleteKeyword(todoId);
  const { form, keywordsFieldArray } = useAddKeywordsForm();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = form;
  const { fields, append, remove } = keywordsFieldArray;

  const onSubmit = handleSubmit(async (data) => {
    await addKeywords.mutateAsync({ keywords: data.keywords });
    reset();
  });

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Keywords</h3>
        <button onClick={onClose} style={closeBtnStyle}>✕</button>
      </div>

      {/* Existing keywords */}
      <div style={{ padding: '12px 16px' }}>
        {isLoading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading…</p>
        ) : keywords.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>No keywords yet. Add some below.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {keywords.map((kw) => (
              <KeywordChip
                key={kw.keywordId}
                keyword={kw}
                onDelete={() => deleteKeyword.mutate(kw.keywordId)}
                isDeleting={deleteKeyword.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />

      {/* Add keywords form */}
      <form onSubmit={onSubmit} style={{ padding: '12px 16px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: '0 0 8px' }}>
          ADD KEYWORDS
        </p>

        {fields.map((field, index) => (
          <div key={field.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              {...register(`keywords.${index}.label`)}
              placeholder="Label"
              style={inputStyle}
            />
            <input
              {...register(`keywords.${index}.color`)}
              type="color"
              title="Pick a color"
              style={colorInputStyle}
            />
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                style={removeBtnStyle}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {errors.keywords && (
          <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 8px' }}>
            Check keyword labels
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => append({ label: '', color: '' })}
            style={addMoreBtnStyle}
          >
            + More
          </button>
          <button type="submit" disabled={isSubmitting} style={saveBtnStyle}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

const KeywordChip: React.FC<{
  keyword: KeywordEntity;
  onDelete: () => void;
  isDeleting: boolean;
}> = ({ keyword, onDelete, isDeleting }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px 3px 6px',
      borderRadius: 9999,
      fontSize: 12,
      fontWeight: 600,
      background: keyword.color ? `${keyword.color}22` : '#eef2ff',
      color: keyword.color ?? '#6366f1',
      border: `1px solid ${keyword.color ?? '#6366f1'}44`,
    }}
  >
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: keyword.color ?? '#6366f1',
      }}
    />
    {keyword.label}
    <button
      onClick={onDelete}
      disabled={isDeleting}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 0, lineHeight: 1, color: 'inherit', opacity: 0.6,
        fontSize: 10, marginLeft: 2,
      }}
    >
      ✕
    </button>
  </span>
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const panelStyle: React.CSSProperties = {
  width: 300, background: '#fff', borderLeft: '1px solid #e5e7eb',
  display: 'flex', flexDirection: 'column', flexShrink: 0,
};
const headerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '14px 16px', borderBottom: '1px solid #e5e7eb',
};
const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18,
};
const inputStyle: React.CSSProperties = {
  flex: 1, padding: '6px 10px', border: '1px solid #d1d5db',
  borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const,
};
const colorInputStyle: React.CSSProperties = {
  width: 34, height: 34, padding: 2, cursor: 'pointer',
  border: '1px solid #d1d5db', borderRadius: 6,
};
const removeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14,
};
const addMoreBtnStyle: React.CSSProperties = {
  padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6,
  background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151',
};
const saveBtnStyle: React.CSSProperties = {
  flex: 1, padding: '6px 12px', border: 'none', borderRadius: 6,
  background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
