import type { Office } from '../entities/office.entity';

export interface OfficesResponseDto {
  success: boolean;
  data: Office[];
}
