import type { Office, OfficesResponseDto } from '@repo/api';
import { apiFetch } from '../client';

export async function getOffices(): Promise<Office[]> {
  const response = await apiFetch<OfficesResponseDto>('/offices', {
    method: 'GET',
  });
  return response.data;
}
