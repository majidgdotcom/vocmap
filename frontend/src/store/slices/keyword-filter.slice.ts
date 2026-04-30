import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from '../index';

interface KeywordFilterState {
  activeKeywordId: string | null;
  activeKeywordLabel: string | null;
}

const initialState: KeywordFilterState = {
  activeKeywordId: null,
  activeKeywordLabel: null,
};

export const keywordFilterSlice = createSlice({
  name: 'keywordFilter',
  initialState,
  reducers: {
    setKeywordFilter(
      state,
      action: PayloadAction<{ keywordId: string; label: string } | null>,
    ) {
      state.activeKeywordId = action.payload?.keywordId ?? null;
      state.activeKeywordLabel = action.payload?.label ?? null;
    },
    clearKeywordFilter(state) {
      state.activeKeywordId = null;
      state.activeKeywordLabel = null;
    },
  },
});

export const { setKeywordFilter, clearKeywordFilter } = keywordFilterSlice.actions;
export const keywordFilterReducer = keywordFilterSlice.reducer;

export const selectActiveKeywordId = (state: RootState) => state.keywordFilter.activeKeywordId;
export const selectActiveKeywordLabel = (state: RootState) =>
  state.keywordFilter.activeKeywordLabel;
