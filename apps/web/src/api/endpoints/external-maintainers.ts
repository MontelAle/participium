import type { User } from '@repo/api';
import { apiFetch } from '../client';

export async function getExternalMaintainers(): Promise<User[]> {
  const response = await apiFetch<{
    success: boolean;
    data: User[];
  }>('/users/external-maintainers', {
    method: 'GET',
  });
  return response.data;
}
