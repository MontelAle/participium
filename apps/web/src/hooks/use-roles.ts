import { getRoles } from '@/api/endpoints/roles';
import type { Role } from '@repo/api';
import { useQuery } from '@tanstack/react-query';

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: getRoles,
  });
}
