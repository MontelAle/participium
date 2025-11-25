import { useQuery, useMutation } from '@tanstack/react-query';
import { getProfile, updateProfileWithFile } from '@/api/endpoints/users';
import type { UpdateProfileDto, UpdateProfileResponseDto } from '@repo/api';

export function useProfile(id: string) {
  // Fetch profile only when id is truthy
  const profileQuery = useQuery<UpdateProfileResponseDto>({
    queryKey: ['profile', id],
    queryFn: () => getProfile(id),
    enabled: !!id,
  });

  // Update profile (with file support)
  const updateMutation = useMutation<
    UpdateProfileResponseDto,
    Error,
    UpdateProfileDto
  >({
    mutationFn: (dto) => updateProfileWithFile(dto),
  });

  return {
    ...profileQuery,
    updateProfile: updateMutation.mutateAsync,
    updateStatus: updateMutation.status,
    updateError: updateMutation.error,
  };
}
