import { getProfile, updateProfileWithFile } from '@/api/endpoints/profile';
import type { Profile } from '@repo/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useProfile(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const profileQuery = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
    enabled: options?.enabled,
  });

  // Update profile (with file support)
  const updateMutation = useMutation<Profile, Error, FormData>({
    mutationFn: (dto) => updateProfileWithFile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    ...profileQuery,
    updateProfile: updateMutation.mutateAsync,
    updateStatus: updateMutation.status,
    updateError: updateMutation.error,
  };
}
