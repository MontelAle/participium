import {
  getNotifications,
  markNotificationRead,
} from '@/api/endpoints/notifications';
import { useAuth } from '@/contexts/auth-context';
import type { Notification } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useNotifications(pollInterval = 10000) {
  const { isAuthenticated } = useAuth();
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(false),
    refetchInterval: isAuthenticated ? pollInterval : false,
    staleTime: 0,
    retry: false,
    enabled: isAuthenticated,
  });
}

export function useUnreadNotifications() {
  const { isAuthenticated } = useAuth();
  return useQuery<Notification[]>({
    queryKey: ['notifications', 'unread'],
    queryFn: () => getNotifications(true),
    refetchInterval: isAuthenticated ? 10000 : false,
    staleTime: 0,
    retry: false,
    enabled: isAuthenticated,
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
