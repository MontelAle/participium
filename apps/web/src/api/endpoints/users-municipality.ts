import { apiFetch } from '../client';
import type { User } from '@repo/api';
import { CreateMunicipalityUserDto } from '@repo/api';

export async function getMunicipalityUsers(): Promise<User[]> {
  return apiFetch<User[]>('/users/municipality', {
    method: 'GET',
  });
}

export async function createMunicipalityUser(
  data: CreateMunicipalityUserDto,
): Promise<User> {
  return apiFetch<User>('/users/municipality', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
