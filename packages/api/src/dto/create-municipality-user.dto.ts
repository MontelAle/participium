import { RegisterDto } from './register.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../entities/role.entity';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMunicipalityUserDto extends RegisterDto {
  @ApiProperty({
    description: 'Municipality user role object',
    example: {
      id: 'KHeEyAaGyFvUjjJUgxG9V',
      name: 'municipal_pr_officer',
    },
    type: () => Role,
  })
  @IsNotEmpty({ message: 'role is required' })
  @ValidateNested()
  @Type(() => Role)
  role: Role;
}
