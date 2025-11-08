import { useQuery } from '@tanstack/react-query';
import { getRoles } from '@/api/endpoints/roles';
import type { Role } from '@repo/api';

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: getRoles,
  });
}
