import type { UpdateMunicipalityUserDto, User } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMunicipalityUser,
  deleteMunicipalityUser,
  getMunicipalityUsers,
  updateMunicipalityUser,
} from '../api/endpoints/municipality-users';

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
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateMunicipalityUserDto;
    }) => updateMunicipalityUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipality-users'] });
    },
  });
}
