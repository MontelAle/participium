import { ResponseDto } from './response.dto';
import { Category } from '../entities/category.entity';

export interface CategoriesResponseDto extends ResponseDto {
  data: Category[];
}
