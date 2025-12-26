import {
  getReport,
  getReports,
  getReportsPublic,
  getReportStats,
  postReportWithImages,
  updateReport,
} from '@/api/endpoints/reports';
import type {
  DashboardStatsDto,
  FilterReportsDto,
  Report,
  UpdateReportDto,
} from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useReports(
  filters?: FilterReportsDto,
  options?: { enabled: boolean; isGuest?: boolean },
) {
  return useQuery<Report[]>({
    queryKey: ['reports', filters, options?.isGuest],
    queryFn: () =>
      options?.isGuest ? getReportsPublic(filters) : getReports(filters),
    enabled: options?.enabled !== false,
    retry: false,
  });
}

export function useReportStats() {
  return useQuery<DashboardStatsDto>({
    queryKey: ['reports-stats'],
    queryFn: getReportStats,
    staleTime: 1000 * 30,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postReportWithImages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports-stats'] });
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports-stats'] });
      queryClient.invalidateQueries({
        queryKey: ['report', variables.reportId],
      });
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
