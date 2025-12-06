import { Category } from '@repo/api';

export type CategoryResponse = {
  success: boolean;
  data: Category[];
};
