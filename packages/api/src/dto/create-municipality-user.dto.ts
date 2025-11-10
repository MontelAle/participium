import { RegisterDto } from './register.dto';
import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMunicipalityUserDto extends RegisterDto {
  @ApiProperty({
    description: 'Municipality role',
    example: 'admin'
  })
  @IsNotEmpty()
  role: string;
}
