import { Role } from '../entities/role.entity';

export class RolesResponseDto {
  success: boolean;
  data: Role[];
}
