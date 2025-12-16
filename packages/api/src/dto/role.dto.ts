import { Role } from '@entities';
import { ResponseDto } from './response.dto';

export interface RolesResponseDto extends ResponseDto {
  data: Role[];
}
