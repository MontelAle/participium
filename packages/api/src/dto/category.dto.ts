import { Category } from '../entities/category.entity';
import { ResponseDto } from './response.dto';

export interface CategoriesResponseDto extends ResponseDto {
  data: Category[];
}
