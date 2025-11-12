import { create } from 'zustand';
import { LocationData } from '@/types/location';

interface ActiveReportStore {
  locationData?: LocationData;
  setLocation: (locationData: LocationData | undefined) => void;
  clearLocation: () => void;
}

export const useActiveReportStore = create<ActiveReportStore>((set) => ({
  locationData: undefined,
  setLocation: (locationData) => set({ locationData }),
  clearLocation: () => set({ locationData: undefined }),
}));
