import { RegisterDto } from './register.dto';
import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'entry';

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
  @IsNotEmpty()
  role: Role;
}
