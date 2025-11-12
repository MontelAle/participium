import { apiFetch } from '../client';
import type { User } from '@repo/api';
import { CreateMunicipalityUserDto } from '@repo/api';
import type { MunicipalityUserResponse } from '@/types/municipality-users';
import { UpdateMunicipalityUserDto } from '@repo/api';

// GET all municiaplity users
export async function getMunicipalityUsers(): Promise<User[]> {
  const response = await apiFetch<MunicipalityUserResponse<User[]>>(
    '/users/municipality',
    {
      method: 'GET',
    },
  );
  return response.data;
}

// GET municiaplity user by ID
export async function getMunicipalityUser(userId: string): Promise<User> {
  const response = await apiFetch<MunicipalityUserResponse<User>>(
    `/users/municipality/user/${userId}`,
    { method: 'GET' },
  );
  return response.data;
}

// CREATE municiaplity user
export async function createMunicipalityUser(
  data: CreateMunicipalityUserDto,
): Promise<User> {
  console.log(data);

  const response = await apiFetch<MunicipalityUserResponse<User>>(
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
): Promise<MunicipalityUserResponse<{ id: string }>> {
  const response = await apiFetch<MunicipalityUserResponse<{ id: string }>>(
    `/users/municipality/user/${userId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return response;
}

// DELETE municipality user
export async function deleteMunicipalityUser(
  userId: string,
): Promise<{ id: string }> {
  const response = await apiFetch<MunicipalityUserResponse<{ id: string }>>(
    `/users/municipality/user/${userId}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.success) {
    throw new Error('An error occurred while deleting the user');
  }

  return response.data;
}
