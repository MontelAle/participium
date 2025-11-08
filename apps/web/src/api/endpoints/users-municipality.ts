import { apiFetch } from '../client';
import type { User } from '@repo/api';

export async function getMunicipalityUsers(): Promise<User[]> {
  return apiFetch<User[]>('/users/municipality', {
    method: 'GET',
  });
}

/*
export async function createMunicipalityUser(data: CreateMunicipalityUserDto): Promise<MunicipalityUser> {
  return apiFetch<MunicipalityUser>("/administrator/municipalityUsers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type CreateMunicipalityUserDto = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string; 
};
*/
