import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { InvestigationDetail, EvidenceAlignment } from '@/models/investigation';

interface InvestigationState {
  currentInvestigation: InvestigationDetail | null;
  alignmentFilter: EvidenceAlignment | 'all';
  searchQuery: string;
  isAnalyzing: boolean;
  error: string | null;
}

const initialState: InvestigationState = {
  currentInvestigation: null,
  alignmentFilter: 'all',
  searchQuery: '',
  isAnalyzing: false,
  error: null,
};

export const investigationSlice = createSlice({
  name: 'investigation',
  initialState,
  reducers: {
    setCurrentInvestigation: (state, action: PayloadAction<InvestigationDetail | null>) => {
      state.currentInvestigation = action.payload;
      state.error = null;
    },
    setAlignmentFilter: (state, action: PayloadAction<EvidenceAlignment | 'all'>) => {
      state.alignmentFilter = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setIsAnalyzing: (state, action: PayloadAction<boolean>) => {
      state.isAnalyzing = action.payload;
    },
    setInvestigationError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isAnalyzing = false;
    },
    clearInvestigation: (state) => {
      state.currentInvestigation = null;
      state.alignmentFilter = 'all';
      state.searchQuery = '';
      state.error = null;
      state.isAnalyzing = false;
    },
  },
});

export const {
  setCurrentInvestigation,
  setAlignmentFilter,
  setSearchQuery,
  setIsAnalyzing,
  setInvestigationError,
  clearInvestigation,
} = investigationSlice.actions;

export default investigationSlice.reducer;
