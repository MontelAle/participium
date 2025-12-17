import type { Role } from '@entities';

export class RolesResponseDto {
  success: boolean;
  data: Role[];
}
