import { ReportData, createReportFormData } from '@/types/report';
import type { Report, ReportsResponseDto } from '@repo/api';
import { ReportResponseDto, UpdateReportDto } from '@repo/api';
import { apiFetch } from '../client';

export async function getReports(): Promise<Report[]> {
  const response = await apiFetch<ReportsResponseDto>('/reports/', {
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
