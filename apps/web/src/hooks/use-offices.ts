import { getOffices } from '@/api/endpoints/offices';
import type { Office } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function useOffices() {
  return useQuery<Office[]>({
    queryKey: ['offices'],
    queryFn: getOffices,
  });
}
