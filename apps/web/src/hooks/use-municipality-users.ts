import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMunicipalityUsers,
  createMunicipalityUser,
} from '../api/endpoints/municipality-users';
import type { User } from '@repo/api';

export function useMunicipalityUsers() {
  return useQuery<User[]>({
    queryKey: ['municipality-users'],
    queryFn: getMunicipalityUsers,
  });
}

export function useCreateMunicipalityUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMunicipalityUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipality-users'] });
    },
  });
}
