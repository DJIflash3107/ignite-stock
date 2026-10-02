import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { applyTheme, getPreferredTheme, type ThemeMode } from '@/lib/theme';

export interface ThemeState {
  mode: ThemeMode;
}

const initialState: ThemeState = {
  // Read the initial value the same way the anti-FOUC script does, so the
  // Redux state matches what is already on <html>.
  mode: getPreferredTheme(),
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      applyTheme(action.payload);
    },
    toggleTheme: (state) => {
      const next: ThemeMode = state.mode === 'dark' ? 'light' : 'dark';
      state.mode = next;
      applyTheme(next);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;

export default themeSlice.reducer;
