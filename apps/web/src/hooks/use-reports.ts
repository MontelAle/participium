import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { Report } from '@repo/api';
import { getReports, postReportWithImages } from '@/api/endpoints/reports';
import { UpdateReportDto } from '@repo/api';
import { updateReport } from '@/api/endpoints/reports';
import { getReport } from '@/api/endpoints/reports';

export function useReports(options?: { enabled: boolean }) {
  return useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await getReports();
      return response;
    },
    enabled: options?.enabled !== false,
    retry: false,
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

export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportId,
      data,
    }: {
      reportId: string;
      data: UpdateReportDto;
    }) => updateReport(reportId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useReport(reportId: string) {
  return useQuery<Report>({
    queryKey: ['report', reportId],
    queryFn: () => getReport(reportId),
    enabled: !!reportId,
  });
}
