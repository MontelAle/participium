import type { MunicipalityUsersResponseDto, User } from '@repo/api';
import { apiFetch } from '../client';

export async function getExternalMaintainers(): Promise<User[]> {
  const response = await apiFetch<MunicipalityUsersResponseDto>(
    '/users/external-maintainers',
    {
      method: 'GET',
    },
  );
  return response.data;
}
