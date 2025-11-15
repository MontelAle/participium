import { apiFetch } from '../client';
import type { Category } from '@repo/api';
import { CategoryResponse } from '@/types/categoty';

export async function getCategories(): Promise<Category[]> {
  const response = await apiFetch<CategoryResponse>('/categories/', {
    method: 'GET',
  });
  return response.data;
}
