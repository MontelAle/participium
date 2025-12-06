import { getOffices } from '@/api/endpoints/offices';
import type { Office } from '@repo/api';
import { useQuery } from '@tanstack/react-query';

export function useOffices() {
  return useQuery<Office[]>({
    queryKey: ['offices'],
    queryFn: getOffices,
  });
}
