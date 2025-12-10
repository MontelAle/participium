import { getExternalMaintainers } from '@/api/endpoints/external-maintainers';
import { User } from '@repo/api';
import { useQuery } from '@tanstack/react-query';

export function useExternalMaintainers() {
  return useQuery<User[]>({
    queryKey: ['external-maintainers'],
    queryFn: getExternalMaintainers,
  });
}
