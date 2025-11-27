import { CategoriesResponseDto as CategoriesResponseDtoInterface } from '@repo/api';
import { Category } from '../entities/category.entity';

export class CategoriesResponseDto implements CategoriesResponseDtoInterface {
  success: boolean;
  data: Category[];
}
