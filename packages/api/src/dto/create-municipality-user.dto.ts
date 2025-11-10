import { RegisterDto } from './register.dto';
import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMunicipalityUserDto extends RegisterDto {
  @ApiProperty({
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
  @IsNotEmpty()
  role: string;
}
