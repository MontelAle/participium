import { getReportComments, postReportComment } from '@/api/endpoints/comments';
import { useAuth } from '@/contexts/auth-context';
import type { Comment } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useReportComments(reportId: string) {
  const { isAuthenticated } = useAuth();
  return useQuery<Comment[]>({
    queryKey: ['report-comments', reportId],
    queryFn: () => getReportComments(reportId),
    enabled: !!reportId && isAuthenticated,
    refetchInterval: isAuthenticated ? 5000 : false,
  });
}

export function usePostReportComment(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => postReportComment(reportId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['report-comments', reportId],
      });
    },
  });
}
