import { getReportComments, postReportComment } from '@/api/endpoints/comments';
import type { Comment } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useReportComments(reportId: string) {
  return useQuery<Comment[]>({
    queryKey: ['report-comments', reportId],
    queryFn: () => getReportComments(reportId),
    enabled: !!reportId,
    refetchInterval: 5000,
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
