import { Role } from '../entities/role.entity';
import { ResponseDto } from './response.dto';

export interface RolesResponseDto extends ResponseDto {
  data: Role[];
}
