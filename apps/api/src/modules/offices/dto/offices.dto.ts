import { Office } from '@entities';

export class OfficesResponseDto {
  success: boolean;
  data: Office[];
}
