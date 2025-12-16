import { Category } from '@entities';
import { ResponseDto } from './response.dto';

export interface CategoriesResponseDto extends ResponseDto {
  data: Category[];
}
