import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { selectedTodoReducer } from './slices/selected-todo.slice';
import { keywordFilterReducer } from './slices/keyword-filter.slice';

export const store = configureStore({
  reducer: {
    selectedTodo: selectedTodoReducer,
    keywordFilter: keywordFilterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
