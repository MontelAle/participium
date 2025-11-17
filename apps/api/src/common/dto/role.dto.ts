import { RolesResponseDto as RolesResponseDtoInterface } from '@repo/api';
import { Role } from '../entities/role.entity';

export class RolesResponseDto implements RolesResponseDtoInterface {
  success: boolean;
  data: Role[];
}
