import type {
  CreateMunicipalityUserDto,
  MunicipalityUserIdResponseDto,
  MunicipalityUserResponseDto,
  MunicipalityUsersResponseDto,
  UpdateMunicipalityUserDto,
  User,
} from '@/types';
import { apiFetch } from '../client';

export async function getMunicipalityUsers(): Promise<User[]> {
  const response = await apiFetch<MunicipalityUsersResponseDto>(
    '/users/municipality',
    {
      method: 'GET',
    },
  );
  return response.data;
}

export async function getMunicipalityUser(userId: string): Promise<User> {
  const response = await apiFetch<MunicipalityUserResponseDto>(
    `/users/municipality/user/${userId}`,
    { method: 'GET' },
  );
  return response.data;
}

export async function createMunicipalityUser(
  data: CreateMunicipalityUserDto,
): Promise<User> {
  const response = await apiFetch<MunicipalityUserResponseDto>(
    '/users/municipality',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
  return response.data;
}

//UPDATE municipality user
export async function updateMunicipalityUser(
  userId: string,
  data: UpdateMunicipalityUserDto,
): Promise<MunicipalityUserIdResponseDto> {
  const response = await apiFetch<MunicipalityUserIdResponseDto>(
    `/users/municipality/user/${userId}`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );

  return response;
}

export async function deleteMunicipalityUser(
  userId: string,
): Promise<{ id: string }> {
  const response = await apiFetch<MunicipalityUserIdResponseDto>(
    `/users/municipality/user/${userId}`,
    {
      method: 'DELETE',
    },
  );

  return response.data;
}
