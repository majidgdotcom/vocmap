import React from 'react';

import { TodoViewModel } from '@/viewmodels/todo.viewmodel';

interface TodoCardProps {
  vm: TodoViewModel;
  isSelected: boolean;
  onSelect: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onOpenKeywords: () => void;
}

const STATUS_COLORS: Record<TodoViewModel['statusColor'], string> = {
  green: '#22c55e',
  blue: '#3b82f6',
  gray: '#9ca3af',
};

export const TodoCard: React.FC<TodoCardProps> = ({
  vm,
  isSelected,
  onSelect,
  onArchive,
  onDelete,
  onOpenKeywords,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      style={{
        padding: '16px',
        border: `2px solid ${isSelected ? '#6366f1' : '#e5e7eb'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        background: isSelected ? '#eef2ff' : '#fff',
        opacity: vm.isArchived ? 0.6 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{vm.title}</h3>

          {vm.description && (
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280', lineHeight: 1.4 }}>
              {vm.description.length > 100
                ? `${vm.description.slice(0, 100)}…`
                : vm.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
            {/* Status badge */}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: STATUS_COLORS[vm.statusColor] + '22',
                color: STATUS_COLORS[vm.statusColor],
                border: `1px solid ${STATUS_COLORS[vm.statusColor]}44`,
              }}
            >
              {vm.statusLabel}
            </span>

            {/* Keyword count */}
            {vm.keywordCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenKeywords();
                }}
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid #d1d5db',
                  background: '#f9fafb',
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                🏷 {vm.keywordCount} keyword{vm.keywordCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af' }}>
            {vm.createdAtFormatted}
          </p>
        </div>

        {/* Actions */}
        <div
          style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {vm.canArchive && (
            <ActionButton label="Archive" onClick={onArchive} color="#f59e0b" />
          )}
          {vm.canDelete && (
            <ActionButton label="Delete" onClick={onDelete} color="#ef4444" />
          )}
        </div>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ label: string; onClick: () => void; color: string }> = ({
  label,
  onClick,
  color,
}) => (
  <button
    title={label}
    onClick={onClick}
    style={{
      fontSize: '11px',
      padding: '3px 8px',
      borderRadius: '4px',
      border: `1px solid ${color}44`,
      background: `${color}11`,
      color,
      cursor: 'pointer',
      fontWeight: 600,
    }}
  >
    {label}
  </button>
);
