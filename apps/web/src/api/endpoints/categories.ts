import type { CategoriesResponseDto, Category } from '@repo/api';
import { apiFetch } from '../client';

export async function getCategories(): Promise<Category[]> {
  const response = await apiFetch<CategoriesResponseDto>('/categories/', {
    method: 'GET',
  });
  return response.data;
}
