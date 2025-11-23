import { create } from 'zustand';
import { DateRange } from 'react-day-picker';

interface FilterState {
  searchTerm: string;
  filters: {
    status: string | null;
    category: string | null;
    dateRange: string | null;
    customDate: DateRange | undefined;
  };
  setSearchTerm: (term: string) => void;
  setFilters: (filters: FilterState['filters']) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchTerm: '',
  filters: {
    status: null,
    category: null,
    dateRange: null,
    customDate: undefined,
  },
  setSearchTerm: (term) => set({ searchTerm: term }),
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  resetFilters: () =>
    set({
      searchTerm: '',
      filters: {
        status: null,
        category: null,
        dateRange: null,
        customDate: undefined,
      },
    }),
}));
