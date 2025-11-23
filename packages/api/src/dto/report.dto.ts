import { ReportStatus, Report } from '../entities/report.entity';
import { ResponseDto } from './response.dto';

export interface CreateReportDto {
  title: string;
  description: string;
  longitude: number;
  latitude: number;
  address?: string;
  categoryId: string;
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
  explanation?: string;
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

export interface ReportsResponseDto extends ResponseDto {
  data: Report[];
}

export interface ReportResponseDto extends ResponseDto {
  data: Report;
}
