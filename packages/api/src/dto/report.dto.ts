import { ReportStatus } from '../entities/report.entity';
export interface CreateReportDto {
  title?: string;
  description?: string;
  longitude: number;
  latitude: number;
  address?: string;
  images?: string[];
  categoryId?: string;
}
export interface UpdateReportDto {
  title?: string;
  description?: string;
  status?: ReportStatus;
  longitude?: number;
  latitude?: number;
  address?: string;
  images?: string[];
  categoryId?: string;
}
export interface FilterReportsDto {
  status?: ReportStatus;
  categoryId?: string;
  userId?: string;
  minLongitude?: number;
  maxLongitude?: number;
  minLatitude?: number;
  maxLatitude?: number;
  searchLongitude?: number;
  searchLatitude?: number;
  radiusMeters?: number;
}
