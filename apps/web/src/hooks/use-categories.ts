import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/api/endpoints/categories';
import type { Category } from '@repo/api';

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
}
