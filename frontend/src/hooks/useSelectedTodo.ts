import { useCallback } from 'react';

import { TodoEntity } from '@vocmap/shared';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectTodo,
  clearSelectedTodo,
  setEditing,
  setViewingKeywords,
  selectSelectedTodo,
  selectIsEditing,
  selectIsViewingKeywords,
} from '@/store/slices/selected-todo.slice';

export function useSelectedTodo() {
  const dispatch = useAppDispatch();
  const selectedTodo = useAppSelector(selectSelectedTodo);
  const isEditing = useAppSelector(selectIsEditing);
  const isViewingKeywords = useAppSelector(selectIsViewingKeywords);

  const select = useCallback(
    (todo: TodoEntity) => dispatch(selectTodo(todo)),
    [dispatch],
  );

  const clear = useCallback(() => dispatch(clearSelectedTodo()), [dispatch]);

  const startEditing = useCallback(
    () => dispatch(setEditing(true)),
    [dispatch],
  );

  const stopEditing = useCallback(
    () => dispatch(setEditing(false)),
    [dispatch],
  );

  const openKeywords = useCallback(
    () => dispatch(setViewingKeywords(true)),
    [dispatch],
  );

  const closeKeywords = useCallback(
    () => dispatch(setViewingKeywords(false)),
    [dispatch],
  );

  return {
    selectedTodo,
    isEditing,
    isViewingKeywords,
    select,
    clear,
    startEditing,
    stopEditing,
    openKeywords,
    closeKeywords,
  };
}
