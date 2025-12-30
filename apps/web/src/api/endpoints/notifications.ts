import type { Notification } from '@/types';
import { apiFetch } from '../client';

export async function getNotifications(
  onlyUnread = false,
): Promise<Notification[]> {
  const q = onlyUnread ? '?unread=1' : '';
  const res = await apiFetch<{ success: boolean; data: Notification[] }>(
    `/notifications${q}`,
    {
      method: 'GET',
    },
  );
  return res.data;
}

export async function markNotificationRead(id: string) {
  const res = await apiFetch<{ success: boolean; data: Notification }>(
    `/notifications/${id}/read`,
    {
      method: 'PATCH',
    },
  );
  return res;
}
