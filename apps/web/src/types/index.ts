import type { Marker } from 'leaflet';
import type { DateRange } from 'react-day-picker';

export type Filters = {
  status?: string;
  category?: string;
  dateRange?: string;
  customDate?: DateRange;
};

export type FilterState = {
  searchTerm: string;
  showOnlyMyReports: boolean;
  filters: Filters;
  setSearchTerm: (term: string) => void;
  setShowOnlyMyReports: (show: boolean) => void;
  setFilters: (filters: Partial<FilterState['filters']>) => void;
  resetFilters: () => void;
};

export type OSMAddress = {
  display_name?: string;
  address: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    pedestrian?: string;
    path?: string;
    house_number?: string;
  };
};

export type OSMSearchResult = {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address?: OSMAddress;
};

export type StatusMarker = Marker & { status?: string };
