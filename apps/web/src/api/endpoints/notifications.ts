import type { Notification } from '@/types';
import type { ResponseDto } from '@/types/dto';
import { apiFetch } from '../client';

export async function getNotifications(
  onlyUnread = false,
): Promise<Notification[]> {
  const q = onlyUnread ? '?unread=1' : '';
  const res = await apiFetch<ResponseDto & { data: Notification[] }>(
    `/notifications${q}`,
    { method: 'GET' },
  );
  return (res as any).data;
}

export async function markNotificationRead(id: string) {
  const res = await apiFetch<ResponseDto>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
  return res;
}
