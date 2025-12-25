import type {
  DashboardStatsDto,
  DashboardStatsResponseDto,
  FilterReportsDto,
  Report,
  ReportResponseDto,
  ReportsResponseDto,
  UpdateReportDto,
} from '@/types';
import { ReportData, createReportFormData } from '@/types/report';
import { apiFetch } from '../client';

export async function getReports(
  filters?: FilterReportsDto,
): Promise<Report[]> {
  const queryString = filters
    ? '?' +
      new URLSearchParams(
        filters as unknown as Record<string, string>,
      ).toString()
    : '';

  const response = await apiFetch<ReportsResponseDto>(
    `/reports${queryString}`,
    {
      method: 'GET',
    },
  );
  return response.data;
}

export async function getReportsPublic(
  filters?: FilterReportsDto,
): Promise<Report[]> {
  const queryString = filters
    ? '?' +
      new URLSearchParams(
        filters as unknown as Record<string, string>,
      ).toString()
    : '';

  const response = await apiFetch<ReportsResponseDto>(
    `/reports/public${queryString}`,
    {
      method: 'GET',
    },
  );
  return response.data;
}

export async function getReportStats(): Promise<DashboardStatsDto> {
  const response = await apiFetch<DashboardStatsResponseDto>('/reports/stats', {
    method: 'GET',
  });
  return response.data;
}

export async function postReportWithImages(reportData: ReportData) {
  const formData = createReportFormData(reportData);

  const res = await apiFetch<ReportResponseDto>('/reports/', {
    method: 'POST',
    body: formData,
  });

  return res.data;
}

export async function updateReport(
  reportId: string,
  data: UpdateReportDto,
): Promise<Report> {
  const response = await apiFetch<ReportResponseDto>(`/reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return response.data;
}

export async function getReport(reportId: string): Promise<Report> {
  const response = await apiFetch<ReportResponseDto>(`/reports/${reportId}`, {
    method: 'GET',
  });

  return response.data;
}
