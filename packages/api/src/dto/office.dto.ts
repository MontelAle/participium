import type { Office } from '@entities';

export interface OfficesResponseDto {
  success: boolean;
  data: Office[];
}
