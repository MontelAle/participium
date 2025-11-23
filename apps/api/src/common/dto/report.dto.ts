import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateReportDto as CreateReportDtoInterface,
  UpdateReportDto as UpdateReportDtoInterface,
  FilterReportsDto as FilterReportsDtoInterface,
  ReportResponseDto as ReportResponseDtoInterface,
  ReportsResponseDto as ReportsResponseDtoInterface,
} from '@repo/api';
import { ReportStatus, Report } from '../entities/report.entity';

export class CreateReportDto implements CreateReportDtoInterface {
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
}

export class UpdateReportDto implements UpdateReportDtoInterface {
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
}

export class FilterReportsDto implements FilterReportsDtoInterface {
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

export class ReportResponseDto implements ReportResponseDtoInterface {
  success: boolean;
  data: Report;
}

export class ReportsResponseDto implements ReportsResponseDtoInterface {
  success: boolean;
  data: Report[];
}
