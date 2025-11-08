import { apiFetch } from '../client';
import type { Role } from '@repo/api';

export async function getRoles(): Promise<Role[]> {
  return apiFetch<Role[]>('/roles/', {
    method: 'GET',
  });
}
