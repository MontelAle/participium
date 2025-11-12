import { create } from 'zustand';

interface ActiveReportStore {
  coordinates?: { latitude: number; longitude: number };
  setCoordinates: (
    coordinates: { latitude: number; longitude: number } | undefined,
  ) => void;
}

export const useActiveReportStore = create<ActiveReportStore>((set) => ({
  coordinates: undefined,
  setCoordinates: (coordinates) => set({ coordinates }),
}));
