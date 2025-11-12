import { IsOptional, IsString, IsEmail, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role} from '../entities/role.entity';

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
    description: 'Municipality user role',
    example: 'admin',
    enum: [
      'admin',
      'municipal_pr_officer',
      'municipal_administrator',
      'technical_officer',
      'transport_officer',
      'special_projects_officer',
      'environmental_officer',
    ],
  })

  @IsOptional()
  role?: Role;
}
