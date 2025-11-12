import { apiFetch } from '../client';
import type { Role } from '@repo/api';
import {RoleResponse} from '@/types/role';

export async function getRoles(): Promise<Role[]> {
  const response = await apiFetch<RoleResponse>('/roles/', {
    method: 'GET',
  });
  return response.data;
}
