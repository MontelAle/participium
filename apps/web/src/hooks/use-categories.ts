import { getCategories } from '@/api/endpoints/categories';
import type { Category } from '@repo/api';
import { useQuery } from '@tanstack/react-query';

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
}
