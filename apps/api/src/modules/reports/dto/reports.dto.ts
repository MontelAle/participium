import type { Report } from '@entities';
import { ReportStatus } from '@entities';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}

export class UpdateReportDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @ApiPropertyOptional({
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsString()
  @IsOptional()
  assignedOfficerId?: string;

  @IsString()
  @IsOptional()
  assignedExternalMaintainerId?: string;
}

export class FilterReportsDto {
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsNumber()
  @IsOptional()
  minLongitude?: number;

  @IsNumber()
  @IsOptional()
  maxLongitude?: number;

  @IsNumber()
  @IsOptional()
  minLatitude?: number;

  @IsNumber()
  @IsOptional()
  maxLatitude?: number;

  @IsNumber()
  @IsOptional()
  searchLongitude?: number;

  @IsNumber()
  @IsOptional()
  searchLatitude?: number;

  @IsNumber()
  @IsOptional()
  radiusMeters?: number;
}

export class ReportResponseDto {
  success: boolean;
  data: Report;
}

export class ReportsResponseDto {
  success: boolean;
  data: Report[];
}

export class DashboardStatsDto {
  @IsNumber()
  total: number;

  @IsNumber()
  pending: number;

  @IsNumber()
  in_progress: number;

  @IsNumber()
  assigned: number;

  @IsNumber()
  rejected: number;

  @IsNumber()
  resolved: number;

  @IsNumber()
  user_assigned: number;

  @IsNumber()
  user_rejected: number;

  @IsNumber()
  user_in_progress: number;

  @IsNumber()
  user_resolved: number;
}

export class DashboardStatsResponseDto {
  success: boolean;
  data: DashboardStatsDto;
}
