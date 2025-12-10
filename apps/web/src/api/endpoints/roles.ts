import type { Role, RolesResponseDto } from '@repo/api';
import { apiFetch } from '../client';

export async function getRoles(): Promise<Role[]> {
  const response = await apiFetch<RolesResponseDto>('/roles/', {
    method: 'GET',
  });
  return response.data;
}
