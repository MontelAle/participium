import { useQuery } from '@tanstack/react-query';
import { getOffices } from '@/api/endpoints/offices';
import type { Office } from '@repo/api';

export function useOffices() {
  return useQuery<Office[]>({
    queryKey: ['offices'],
    queryFn: getOffices,
  });
}
