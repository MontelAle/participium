import { apiFetch } from '../client';
import type { User } from '@repo/api';
import { CreateMunicipalityUserDto } from '@repo/api';
import type { MunicipalityUserResponse } from '@/types/municipality-users';
import { UpdateUserDto } from '@repo/api';

// GET all municiaplity users
export async function getMunicipalityUsers(): Promise<User[]> {
  const response = await apiFetch<MunicipalityUserResponse<User[]>>('/users/municipality', {
    method: 'GET',
  });
  return response.data;
}

// GET municiaplity user by ID
export async function getMunicipalityUser(userId: string): Promise<User> {
  const response = await apiFetch<MunicipalityUserResponse<User>>(
    `/users/municipality/user/${userId}`,
    { method: 'GET' }
  );
  return response.data;
}

// CREATE municiaplity user
export async function createMunicipalityUser(
  data: CreateMunicipalityUserDto,
): Promise<User> {
  const response = await apiFetch<MunicipalityUserResponse<User>>('/users/municipality', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}


// UPDATE municiaplity user
export async function updateMunicipalityUser(
  userId: string,
  data: UpdateUserDto,
): Promise<User> {
  const response = await apiFetch<MunicipalityUserResponse<User>>(
    `/users/municipality/user/${userId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
  return response.data;
}
  

// DELETE municiaplity user
export async function deleteMunicipalityUser(userId: string): Promise<void> {
  const response = await apiFetch<MunicipalityUserResponse<null>>(
    `/users/municipality/user/${userId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.success) {
    throw new Error('Errore durante l\'eliminazione dell\'utente');
  }
}