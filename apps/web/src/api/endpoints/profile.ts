import { apiFetch } from '../client';
import { ProfileResponseDto } from '@repo/api';
import type { User } from '@repo/api';

export async function updateProfileWithFile(formData: FormData) {
  const res = await fetch('http://localhost:5000/api/users/profile/me', {
    method: 'PATCH',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Network error' }));
    const errorMessage = Array.isArray(error.message)
      ? error.message[0]
      : error.message || `Request failed with status ${res.status}`;
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function getProfile(): Promise<User> {
  const res = await apiFetch<ProfileResponseDto>(`/users/profile/me`);

  return res.data;
}
