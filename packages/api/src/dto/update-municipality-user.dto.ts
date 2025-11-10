import { IsOptional, IsString, IsEmail, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMunicipalityUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Unique username for the account',
    example: 'john_doe',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User role',
    example: 'admin',
    enum: [
      'user',
      'admin',
      'municipal_pr_officer',
      'municipal_administrator',
      'technical_officer',
      'transport_officer',
      'special_projects_officer',
      'environmental_officer',
    ],
  })
  @IsString()
  @IsOptional()
  role?: string;
}
