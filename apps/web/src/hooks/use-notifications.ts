import {
  getNotifications,
  markNotificationRead,
} from '@/api/endpoints/notifications';
import type { Notification } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useNotifications(pollInterval = 10000) {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(false),
    refetchInterval: pollInterval,
    staleTime: 0,
    retry: false,
  });
}

export function useUnreadNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications', 'unread'],
    queryFn: () => getNotifications(true),
    refetchInterval: 10000,
    staleTime: 0,
    retry: false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });
}
