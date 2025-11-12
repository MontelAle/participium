import { create } from 'zustand';
import { LocationData } from '@/types/location';

interface ActiveReportStore {
  locationData?: LocationData;
  setLocation: (location: LocationData | undefined) => void;
}

export const useActiveReportStore = create<ActiveReportStore>((set) => ({
  location: undefined,
  setLocation: (locationData) => set({ locationData }),
}));
