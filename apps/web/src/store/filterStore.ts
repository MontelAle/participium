import type { ReportFilterState } from '@/types';
import { create } from 'zustand';

export const useFilterStore = create<ReportFilterState>((set) => ({
  searchTerm: '',
  showOnlyMyReports: false,
  filters: {
    status: undefined,
    category: undefined,
    dateRange: undefined,
    customDate: undefined,
  },
  setSearchTerm: (term) => set({ searchTerm: term }),
  setShowOnlyMyReports: (show) => set({ showOnlyMyReports: show }),
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  resetFilters: () =>
    set({
      searchTerm: '',
      showOnlyMyReports: false,
      filters: {
        status: undefined,
        category: undefined,
        dateRange: undefined,
        customDate: undefined,
      },
    }),
}));
