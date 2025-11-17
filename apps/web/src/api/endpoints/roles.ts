import { apiFetch } from '../client';
import type { Role } from '@repo/api';
import type { RolesResponseDto } from '@repo/api';

export async function getRoles(): Promise<Role[]> {
  const response = await apiFetch<RolesResponseDto>('/roles/', {
    method: 'GET',
  });
  return response.data;
}
