import type { CategoriesResponseDto as CategoriesResponseDtoType } from '@repo/api';
import { Category } from '../entities/category.entity';

export class CategoriesResponseDto implements CategoriesResponseDtoType {
  success: boolean;
  data: Category[];
}
