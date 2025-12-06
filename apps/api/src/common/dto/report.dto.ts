import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CreateReportDto as CreateReportDtoType,
  FilterReportsDto as FilterReportsDtoType,
  ReportResponseDto as ReportResponseDtoType,
  ReportsResponseDto as ReportsResponseDtoType,
  UpdateReportDto as UpdateReportDtoType,
} from '@repo/api';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Report, ReportStatus } from '../entities/report.entity';

export class CreateReportDto implements CreateReportDtoType {
  @IsString()
  title: string;

  @IsString()
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
  categoryId: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}

export class UpdateReportDto implements UpdateReportDtoType {
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
}

export class FilterReportsDto implements FilterReportsDtoType {
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

export class ReportResponseDto implements ReportResponseDtoType {
  success: boolean;
  data: Report;
}

export class ReportsResponseDto implements ReportsResponseDtoType {
  success: boolean;
  data: Report[];
}
