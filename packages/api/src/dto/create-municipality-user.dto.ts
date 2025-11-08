import { RegisterDto } from './register.dto';
import { IsNotEmpty } from 'class-validator';

export class CreateMunicipalityUserDto extends RegisterDto {
  @IsNotEmpty()
  role: string;
}
