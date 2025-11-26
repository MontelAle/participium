import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfileWithFile } from '@/api/endpoints/profile';
import type {
  UpdateProfileDto,
  UpdateProfileResponseDto,
  ProfileResponseDto,
} from '@repo/api';

export function useProfile() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery<ProfileResponseDto>({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  });

  // Update profile (with file support)
  const updateMutation = useMutation<
    UpdateProfileResponseDto,
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
