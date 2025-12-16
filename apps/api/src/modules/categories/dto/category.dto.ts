import { Category } from '@entities';

export class CategoriesResponseDto {
  success: boolean;
  data: Category[];
}
