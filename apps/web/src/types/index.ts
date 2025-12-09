import type { Profile, User } from '@repo/api';
import type { Marker } from 'leaflet';
import type { DateRange } from 'react-day-picker';

export type ReportFilters = {
  status?: string;
  category?: string;
  dateRange?: string;
  customDate?: DateRange;
};

export type ReportFilterState = {
  searchTerm: string;
  showOnlyMyReports: boolean;
  filters: ReportFilters;
  setSearchTerm: (term: string) => void;
  setShowOnlyMyReports: (show: boolean) => void;
  setFilters: (filters: Partial<ReportFilterState['filters']>) => void;
  resetFilters: () => void;
};

export type Address = {
  road?: string;
  city?: string;
  state?: string;
  country?: string;
  pedestrian?: string;
  path?: string;
  house_number?: string;
};

export type NominatimAddressData = {
  display_name?: string;
  address: Address;
};

export type NominatimSearchResult = {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddressData;
};

export type StatusMarker = Marker & { status?: string };

export type ProfileFormValues = {
  telegramUsername?: string;
  emailNotificationsEnabled: boolean;
  profilePicture?: File | null;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

export type MapSearchBoxProps = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isSearching: boolean;
  setSearchResults: (val: NominatimSearchResult[]) => void;
  searchResults: NominatimSearchResult[];
  onSelect: (lat: number, lon: number, item: NominatimSearchResult) => void;
};

export type MapControlsProps = {
  mapType: 'standard' | 'satellite';
  setMapType: (type: 'standard' | 'satellite') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export type PhotoUploaderProps = {
  photos: File[];
  onChange: (photos: File[]) => void;
  maxPhotos?: number;
};

export type ProfileFormProps = {
  profile: Profile | undefined;
  user: User | undefined;
  updateProfile: (formData: FormData) => Promise<Profile>;
};
