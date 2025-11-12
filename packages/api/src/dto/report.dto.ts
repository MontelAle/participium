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

export class CreateReportDto {
  @ApiPropertyOptional({
    description: 'Title of the report',
    example: 'Broken streetlight on Main Street',
  })
  @IsString()
  @IsOptional() // TODO: Rendere obbligatorio in futuro
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the report',
    example:
      'The streetlight in front of building number 42 has been broken for 3 days',
  })
  @IsString()
  @IsOptional() // TODO: Rendere obbligatorio in futuro
  description?: string;

  @ApiProperty({
    description: 'Longitude coordinate (WGS84)',
    example: 7.686864,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Latitude coordinate (WGS84)',
    example: 45.070312,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiPropertyOptional({
    description: 'Human-readable address',
    example: 'Via Roma 42, 10100 Torino',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    type: [String],
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    description: 'Category ID for the report',
    example: 'cat_streetlight',
  })
  @IsString()
  @IsOptional() // TODO: Rendere obbligatorio in futuro
  categoryId?: string;
}

export class UpdateReportDto {
  @ApiPropertyOptional({
    description: 'Title of the report',
    example: 'Updated: Broken streetlight on Main Street',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the report',
    example: 'Updated description with more details',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Report status',
    enum: ReportStatus,
    example: ReportStatus.IN_PROGRESS,
  })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @ApiPropertyOptional({
    description: 'Longitude coordinate (WGS84)',
    example: 7.686864,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Latitude coordinate (WGS84)',
    example: 45.070312,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Human-readable address',
    example: 'Via Roma 42, 10100 Torino',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    type: [String],
    example: ['https://example.com/image1.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    description: 'Category ID for the report',
    example: 'cat_streetlight',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class FilterReportsDto {
  @ApiPropertyOptional({
    description: 'Filter by report status',
    enum: ReportStatus,
    example: ReportStatus.PENDING,
  })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 'cat_streetlight',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'user_123',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Minimum longitude for bounding box filter',
    example: 7.5,
  })
  @IsNumber()
  @IsOptional()
  minLongitude?: number;

  @ApiPropertyOptional({
    description: 'Maximum longitude for bounding box filter',
    example: 7.8,
  })
  @IsNumber()
  @IsOptional()
  maxLongitude?: number;

  @ApiPropertyOptional({
    description: 'Minimum latitude for bounding box filter',
    example: 44.9,
  })
  @IsNumber()
  @IsOptional()
  minLatitude?: number;

  @ApiPropertyOptional({
    description: 'Maximum latitude for bounding box filter',
    example: 45.2,
  })
  @IsNumber()
  @IsOptional()
  maxLatitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude for radius search center point',
    example: 7.686864,
  })
  @IsNumber()
  @IsOptional()
  searchLongitude?: number;

  @ApiPropertyOptional({
    description: 'Latitude for radius search center point',
    example: 45.070312,
  })
  @IsNumber()
  @IsOptional()
  searchLatitude?: number;

  @ApiPropertyOptional({
    description: 'Search radius in meters',
    example: 5000,
  })
  @IsNumber()
  @IsOptional()
  radiusMeters?: number;
}
