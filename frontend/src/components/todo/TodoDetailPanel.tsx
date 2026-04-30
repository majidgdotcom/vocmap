import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { TodoEntity, UpdateTodoSchema, UpdateTodoInput, TodoStatus } from '@vocmap/shared';
import { useUpdateTodo, useArchiveTodo, useDeleteTodo } from '@/services/todo.service';
import { toTodoViewModel } from '@/viewmodels/todo.viewmodel';
import { useSelectedTodo } from '@/hooks/useSelectedTodo';

interface TodoDetailPanelProps {
  todo: TodoEntity;
  onOpenKeywords: () => void;
}

export const TodoDetailPanel: React.FC<TodoDetailPanelProps> = ({ todo, onOpenKeywords }) => {
  const vm = toTodoViewModel(todo);
  const { clear, startEditing, stopEditing, isEditing } = useSelectedTodo();
  const updateTodo = useUpdateTodo();
  const archiveTodo = useArchiveTodo();
  const deleteTodo = useDeleteTodo();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<UpdateTodoInput>({
    resolver: zodResolver(UpdateTodoSchema),
    defaultValues: {
      title: todo.title,
      description: todo.description ?? '',
      status: todo.status,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    await updateTodo.mutateAsync({ todoId: todo.todoId, ...data });
    stopEditing();
  });

  const handleArchive = async () => {
    if (!window.confirm('Archive this todo?')) return;
    await archiveTodo.mutateAsync(todo.todoId);
    clear();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this todo permanently?')) return;
    await deleteTodo.mutateAsync(todo.todoId);
    clear();
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span
          style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
            letterSpacing: '0.08em', color: '#9ca3af',
          }}
        >
          Todo Detail
        </span>
        <button onClick={clear} style={iconBtnStyle} title="Close">✕</button>
      </div>

      {isEditing ? (
        /* ── Edit form ────────────────────────────────────────────────────── */
        <form onSubmit={onSubmit} style={bodyStyle}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input {...register('title')} style={inputStyle} />
            {errors.title && <FieldError msg={errors.title.message!} />}
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              {...register('description')}
              style={{ ...inputStyle, height: 100, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select {...register('status')} style={inputStyle}>
              <option value={TodoStatus.ACTIVE}>Active</option>
              <option value={TodoStatus.COMPLETED}>Completed</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
            <button
              type="button"
              onClick={() => { stopEditing(); reset(); }}
              style={cancelBtnStyle}
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} style={primaryBtnStyle}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        /* ── Read view ────────────────────────────────────────────────────── */
        <div style={bodyStyle}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>
            {vm.title}
          </h2>

          {/* Status badge */}
          <StatusBadge color={vm.statusColor} label={vm.statusLabel} />

          {vm.description && (
            <p style={{ margin: '12px 0 0', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              {vm.description}
            </p>
          )}

          {/* Meta */}
          <div style={metaStyle}>
            <MetaRow label="Created" value={vm.createdAtFormatted} />
            <MetaRow label="Updated" value={vm.updatedAtFormatted} />
            {vm.archivedAtFormatted && (
              <MetaRow label="Archived" value={vm.archivedAtFormatted} />
            )}
            <MetaRow label="Keywords" value={String(vm.keywordCount)} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginTop: 16 }}>
            <button onClick={onOpenKeywords} style={secondaryBtnStyle}>
              🏷 Manage Keywords
            </button>

            {vm.canEdit && (
              <button onClick={startEditing} style={secondaryBtnStyle}>
                ✏️ Edit Todo
              </button>
            )}

            {vm.canArchive && (
              <button
                onClick={handleArchive}
                disabled={archiveTodo.isPending}
                style={{ ...secondaryBtnStyle, color: '#d97706', borderColor: '#fcd34d' }}
              >
                {archiveTodo.isPending ? 'Archiving…' : '📦 Archive'}
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={deleteTodo.isPending}
              style={{ ...secondaryBtnStyle, color: '#dc2626', borderColor: '#fca5a5' }}
            >
              {deleteTodo.isPending ? 'Deleting…' : '🗑 Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Small reusables ────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ color: string; label: string }> = ({ color, label }) => {
  const colorMap: Record<string, string> = {
    green: '#22c55e', blue: '#3b82f6', gray: '#9ca3af',
  };
  const hex = colorMap[color] ?? '#9ca3af';
  return (
    <span style={{
      display: 'inline-block', fontSize: 12, fontWeight: 600,
      padding: '3px 10px', borderRadius: 9999,
      background: `${hex}22`, color: hex, border: `1px solid ${hex}44`,
    }}>
      {label}
    </span>
  );
};

const MetaRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
    <span style={{ color: '#9ca3af', fontWeight: 600 }}>{label}</span>
    <span style={{ color: '#374151' }}>{value}</span>
  </div>
);

const FieldError: React.FC<{ msg: string }> = ({ msg }) => (
  <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{msg}</p>
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const panelStyle: React.CSSProperties = {
  width: 320, flexShrink: 0, borderLeft: '1px solid #e5e7eb',
  display: 'flex', flexDirection: 'column', background: '#fff',
};
const headerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
};
const bodyStyle: React.CSSProperties = {
  padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1,
};
const metaStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 6,
  marginTop: 12, padding: 12, background: '#f9fafb',
  borderRadius: 8, border: '1px solid #e5e7eb',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #d1d5db',
  borderRadius: 6, fontSize: 13, boxSizing: 'border-box',
};
const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16,
};
const primaryBtnStyle: React.CSSProperties = {
  flex: 1, padding: '8px 0', border: 'none', borderRadius: 6,
  background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13,
};
const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6,
  background: '#fff', cursor: 'pointer', fontSize: 13,
};
const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6,
  background: '#fff', cursor: 'pointer', fontSize: 13, textAlign: 'left', color: '#374151',
};
