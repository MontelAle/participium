export interface ReportSessionData {
  step:
    | 'location'
    | 'title'
    | 'description'
    | 'category'
    | 'photos'
    | 'anonymity'
    | 'confirm';
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  title?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  photos: string[];
  isAnonymous?: boolean;
}
