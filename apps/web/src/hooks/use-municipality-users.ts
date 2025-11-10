import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMunicipalityUsers,
  createMunicipalityUser,
  deleteMunicipalityUser,
  updateMunicipalityUser,
  getMunicipalityUser
} from '../api/endpoints/municipality-users';
import type { User } from '@repo/api';
import { UpdateUserDto } from '@repo/api';


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

export function useDeleteMunicipalityUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMunicipalityUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipality-users'] });
    },
  });
}


export function useUpdateMunicipalityUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserDto }) =>
      updateMunicipalityUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipality-users'] });
    },
  });
}