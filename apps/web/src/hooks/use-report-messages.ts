import { getReportMessages, postReportMessage } from '@/api/endpoints/messages';
import type { Message } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useReportMessages(reportId: string) {
  return useQuery<Message[]>({
    queryKey: ['report-messages', reportId],
    queryFn: () => getReportMessages(reportId),
    enabled: !!reportId,
    refetchInterval: 5000,
  });
}

export function usePostReportMessage(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => postReportMessage(reportId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['report-messages', reportId],
      });
    },
  });
}
