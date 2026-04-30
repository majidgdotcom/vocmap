import React, { useState, useMemo } from 'react';

import { TodoStatus } from '@vocmap/shared';
import { useTodos } from '@/services/todo.service';
import { toTodoViewModel } from '@/viewmodels/todo.viewmodel';
import { useSelectedTodo } from '@/hooks/useSelectedTodo';
import { useAppSelector } from '@/store';
import { selectActiveKeywordId } from '@/store/slices/keyword-filter.slice';

import { TopBar } from '@/components/layout/TopBar';
import { KeywordSidebar } from '@/components/keyword/KeywordSidebar';
import { KeywordPanel } from '@/components/keyword/KeywordPanel';
import { TodoCard } from '@/components/todo/TodoCard';
import { TodoDetailPanel } from '@/components/todo/TodoDetailPanel';
import { CreateTodoModal } from '@/components/todo/CreateTodoModal';
import { useArchiveTodo, useDeleteTodo } from '@/services/todo.service';
import { useKeywords } from '@/services/keyword.service';

type TabFilter = 'all' | 'active' | 'completed' | 'archived';

export const TodosPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tabFilter, setTabFilter] = useState<TabFilter>('active');

  const activeKeywordId = useAppSelector(selectActiveKeywordId);
  const { selectedTodo, select, clear, openKeywords, closeKeywords, isViewingKeywords } =
    useSelectedTodo();

  const archiveTodo = useArchiveTodo();
  const deleteTodo = useDeleteTodo();

  // Build query from tab + keyword filter
  const statusMap: Partial<Record<TabFilter, TodoStatus>> = {
    active: TodoStatus.ACTIVE,
    completed: TodoStatus.COMPLETED,
    archived: TodoStatus.ARCHIVED,
  };

  const { data: todosData, isLoading, isError } = useTodos({
    status: statusMap[tabFilter],
    keywordId: activeKeywordId ?? undefined,
    limit: 50,
  });

  const todos = todosData?.items ?? [];
  const viewModels = useMemo(() => todos.map(toTodoViewModel), [todos]);

  // Collect all unique keywords for the sidebar (from loaded todos)
  const { data: allKeywords = [], isLoading: kwLoading } = useKeywords(
    selectedTodo?.todoId ?? '',
  );

  // For sidebar we need a flat list of all unique keywords across todos.
  // In a production app you'd have a dedicated "list all user keywords" endpoint.
  // Here we aggregate from the selected todo as a demo.
  const sidebarKeywords = allKeywords;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar onNewTodo={() => setShowCreateModal(true)} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Keyword sidebar ──────────────────────────────────────────────── */}
        <KeywordSidebar keywords={sidebarKeywords} isLoading={kwLoading} />

        {/* ── Main todo list ───────────────────────────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={tabBarStyle}>
            {(['active', 'completed', 'archived', 'all'] as TabFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTabFilter(t)}
                style={tabStyle(tabFilter === t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}

            {todosData && (
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af', alignSelf: 'center', paddingRight: 16 }}>
                {todosData.count ?? todos.length} todos
              </span>
            )}
          </div>

          {/* List */}
          <div style={listStyle}>
            {isLoading && (
              <div style={centeredStyle}>
                <p style={{ color: '#9ca3af' }}>Loading todos…</p>
              </div>
            )}

            {isError && (
              <div style={centeredStyle}>
                <p style={{ color: '#ef4444' }}>Failed to load todos. Please try again.</p>
              </div>
            )}

            {!isLoading && !isError && todos.length === 0 && (
              <div style={centeredStyle}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>
                  {tabFilter === 'active'
                    ? 'No active todos. Create one above!'
                    : `No ${tabFilter} todos.`}
                </p>
              </div>
            )}

            {!isLoading && viewModels.map((vm, i) => (
              <TodoCard
                key={vm.todoId}
                vm={vm}
                isSelected={selectedTodo?.todoId === vm.todoId}
                onSelect={() => select(todos[i])}
                onArchive={() => archiveTodo.mutate(vm.todoId)}
                onDelete={() => {
                  if (window.confirm('Delete this todo?')) {
                    deleteTodo.mutate(vm.todoId);
                    if (selectedTodo?.todoId === vm.todoId) clear();
                  }
                }}
                onOpenKeywords={() => {
                  select(todos[i]);
                  openKeywords();
                }}
              />
            ))}
          </div>
        </main>

        {/* ── Todo detail panel ────────────────────────────────────────────── */}
        {selectedTodo && !isViewingKeywords && (
          <TodoDetailPanel
            todo={selectedTodo}
            onOpenKeywords={openKeywords}
          />
        )}

        {/* ── Keyword management panel ─────────────────────────────────────── */}
        {selectedTodo && isViewingKeywords && (
          <KeywordPanel
            todoId={selectedTodo.todoId}
            onClose={closeKeywords}
          />
        )}
      </div>

      {/* ── Create todo modal ─────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateTodoModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const tabBarStyle: React.CSSProperties = {
  display: 'flex', gap: 2, padding: '8px 16px',
  borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0,
};
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '5px 14px', border: 'none', borderRadius: 6,
  background: active ? '#eef2ff' : 'transparent',
  color: active ? '#6366f1' : '#6b7280',
  fontWeight: active ? 700 : 400,
  fontSize: 13, cursor: 'pointer',
  borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
});
const listStyle: React.CSSProperties = {
  flex: 1, overflowY: 'auto', padding: 16,
  display: 'flex', flexDirection: 'column', gap: 10,
  background: '#f9fafb',
};
const centeredStyle: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', padding: 40,
};
