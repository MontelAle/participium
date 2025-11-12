import { RegisterDto } from './register.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../entities/role.entity';
import { IsNotEmpty } from 'class-validator';

export class CreateMunicipalityUserDto extends RegisterDto {
  @ApiProperty({
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
  
  @IsNotEmpty({ message: 'role is required' })
  role: Role;
}
