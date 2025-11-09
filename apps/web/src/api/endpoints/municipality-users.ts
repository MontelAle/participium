import { apiFetch } from '../client';
import type { User } from '@repo/api';
import { CreateMunicipalityUserDto } from '@repo/api';
import type { MunicipalityUserResponse } from '@/types/municipality-users';

export async function getMunicipalityUsers(): Promise<User[]> {
  const response = await apiFetch<MunicipalityUserResponse<User[]>>('/users/municipality', {
    method: 'GET',
  });
  return response.data;
}

export async function createMunicipalityUser(
  data: CreateMunicipalityUserDto,
): Promise<User> {
  const response = await apiFetch<MunicipalityUserResponse<User>>('/users/municipality', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}
