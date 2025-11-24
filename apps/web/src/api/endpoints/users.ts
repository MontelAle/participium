import { apiFetch } from '../client';
import { UpdateProfileDto } from '@repo/api';
import { UpdateProfileResponseDto } from '@repo/api';

export async function updateProfileWithFile(data: {
  telegramUsername?: string;
  emailNotificationsEnabled?: boolean;
  profilePicture?: File | null;
}) {
  const formData = new FormData();
  if (data.telegramUsername)
    formData.append('telegramUsername', data.telegramUsername);
  if (typeof data.emailNotificationsEnabled !== 'undefined')
    formData.append(
      'emailNotificationsEnabled',
      String(data.emailNotificationsEnabled),
    );
  if (data.profilePicture)
    formData.append('profilePicture', data.profilePicture);

  return apiFetch('/users/profile', {
    method: 'PATCH',
    body: formData,
  });
}

export async function getProfile(id: string) {
  return apiFetch<UpdateProfileResponseDto>(`/users/profile/${id}`);
}
