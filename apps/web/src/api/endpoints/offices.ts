import type { Office } from '@repo/api';
import { apiFetch } from '../client';

export async function getOffices(): Promise<Office[]> {
  const response = await apiFetch<{ success: boolean; data: Office[] }>(
    '/offices',
    {
      method: 'GET',
    },
  );
  return response.data;
}
