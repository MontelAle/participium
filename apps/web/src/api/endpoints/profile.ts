import { apiFetch } from '../client';
import { ProfileResponseDto } from '@repo/api';
import type { Profile } from '@repo/api';

export async function updateProfileWithFile(
  formData: FormData,
): Promise<Profile> {
  const res = await apiFetch<ProfileResponseDto>('/profiles/profile/me', {
    method: 'PATCH',
    body: formData,
  });

  return res.data;
}

export async function getProfile(): Promise<Profile> {
  const res = await apiFetch<ProfileResponseDto>(`/profiles/profile/me`);

  return res.data;
}
