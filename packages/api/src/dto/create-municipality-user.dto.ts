import { RegisterDto } from './register.dto';
import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMunicipalityUserDto extends RegisterDto {
  @ApiProperty({
    description: 'Municipality role (admin or moderator)',
    example: 'admin',
    enum: ['admin', 'moderator'],
  })
  @IsNotEmpty()
  role: string;
}
