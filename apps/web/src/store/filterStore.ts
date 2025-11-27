import { create } from 'zustand';
import { DateRange } from 'react-day-picker';

interface FilterState {
  searchTerm: string;
  showOnlyMyReports: boolean;
  filters: {
    status: string | null;
    category: string | null;
    dateRange: string | null;
    customDate: DateRange | undefined;
  };
  setSearchTerm: (term: string) => void;
  setShowOnlyMyReports: (show: boolean) => void;
  setFilters: (filters: Partial<FilterState['filters']>) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchTerm: '',
  showOnlyMyReports: false,
  filters: {
    status: null,
    category: null,
    dateRange: null,
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
        status: null,
        category: null,
        dateRange: null,
        customDate: undefined,
      },
    }),
}));
