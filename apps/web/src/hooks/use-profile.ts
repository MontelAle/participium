import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfileWithFile } from '@/api/endpoints/profile';
import type { UpdateProfileDto, ProfileResponseDto, Profile } from '@repo/api';

export function useProfile(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const profileQuery = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
    enabled: options?.enabled,
  });

  // Update profile (with file support)
  const updateMutation = useMutation<
    ProfileResponseDto,
    Error,
    UpdateProfileDto
  >({
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
