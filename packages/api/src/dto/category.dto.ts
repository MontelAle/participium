import { Category } from '../entities/category.entity';

export class CategoriesResponseDto {
  success: boolean;
  data: Category[];
}
