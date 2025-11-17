import { ResponseDto } from './response.dto';
import { Role } from '../entities/role.entity';

export interface RolesResponseDto extends ResponseDto {
  data: Role[];
}
