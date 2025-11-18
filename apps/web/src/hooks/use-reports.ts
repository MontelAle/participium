import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { Report } from '@repo/api';
import { getReports, postReportWithImages } from '@/api/endpoints/reports';

export function useReports() {
  return useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: getReports,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postReportWithImages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
