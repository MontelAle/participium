import { RolesResponseDto as RolesResponseDtoInterface, Role } from '@repo/api';

export class RolesResponseDto implements RolesResponseDtoInterface {
  success: boolean;
  data: Role[];
}
