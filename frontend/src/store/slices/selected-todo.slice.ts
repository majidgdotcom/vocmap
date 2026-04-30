import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TodoEntity } from '@vocmap/shared';
import { RootState } from '../index';

interface SelectedTodoState {
  todo: TodoEntity | null;
  isEditing: boolean;
  isViewingKeywords: boolean;
}

const initialState: SelectedTodoState = {
  todo: null,
  isEditing: false,
  isViewingKeywords: false,
};

export const selectedTodoSlice = createSlice({
  name: 'selectedTodo',
  initialState,
  reducers: {
    selectTodo(state, action: PayloadAction<TodoEntity>) {
      state.todo = action.payload;
      state.isEditing = false;
      state.isViewingKeywords = false;
    },
    clearSelectedTodo(state) {
      state.todo = null;
      state.isEditing = false;
      state.isViewingKeywords = false;
    },
    setEditing(state, action: PayloadAction<boolean>) {
      state.isEditing = action.payload;
    },
    setViewingKeywords(state, action: PayloadAction<boolean>) {
      state.isViewingKeywords = action.payload;
    },
    // Optimistic update when a todo is updated
    updateSelectedTodo(state, action: PayloadAction<Partial<TodoEntity>>) {
      if (state.todo) {
        state.todo = { ...state.todo, ...action.payload };
      }
    },
  },
});

export const {
  selectTodo,
  clearSelectedTodo,
  setEditing,
  setViewingKeywords,
  updateSelectedTodo,
} = selectedTodoSlice.actions;

export const selectedTodoReducer = selectedTodoSlice.reducer;

// Selectors
export const selectSelectedTodo = (state: RootState) => state.selectedTodo.todo;
export const selectIsEditing = (state: RootState) => state.selectedTodo.isEditing;
export const selectIsViewingKeywords = (state: RootState) => state.selectedTodo.isViewingKeywords;
