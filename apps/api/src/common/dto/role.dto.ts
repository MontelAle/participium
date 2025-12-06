import type { RolesResponseDto as RolesResponseDtoType } from '@repo/api';
import { Role } from '../entities/role.entity';

export class RolesResponseDto implements RolesResponseDtoType {
  success: boolean;
  data: Role[];
}
