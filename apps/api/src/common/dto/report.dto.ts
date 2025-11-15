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
import { ReportStatus } from '../entities/report.entity';
import {
  CreateReportDto as CreateReportDtoInterface,
  UpdateReportDto as UpdateReportDtoInterface,
  FilterReportsDto as FilterReportsDtoInterface,
} from '@repo/api';

export class CreateReportDto implements CreateReportDtoInterface {
  @IsString()
  @IsOptional() // TODO: Rendere obbligatorio in futuro
  title?: string;

  @IsString()
  @IsOptional() // TODO: Rendere obbligatorio in futuro
  description?: string;

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
  @IsOptional() // TODO: Rendere obbligatorio in futuro
  categoryId?: string;
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
