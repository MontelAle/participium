import { RegisterDto } from './register.dto';
import { IsString } from 'class-validator';

export class CreateMunicipalityUserDto extends RegisterDto {
  @IsString()
  roleId: string;
}
