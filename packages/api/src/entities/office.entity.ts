import { Category } from './category.entity';

export interface Office {
  id: string;
  name: string;
  label: string;
  isExternal: boolean;
  categories: Category[];
}
