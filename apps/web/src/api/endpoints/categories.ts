import { apiFetch } from '../client';
import type { Category } from '@repo/api';
import type { CategoriesResponseDto } from '@repo/api';

export async function getCategories(): Promise<Category[]> {
  const response = await apiFetch<CategoriesResponseDto>('/categories/', {
    method: 'GET',
  });
  return response.data;
}

