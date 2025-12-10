import type { OfficesResponseDto as OfficesResponseDtoType } from '@repo/api';
import { Office } from '../entities/office.entity';

export class OfficesResponseDto implements OfficesResponseDtoType {
  success: boolean;
  data: Office[];
}
