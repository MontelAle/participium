import { apiFetch } from '../client';
import type { Report } from '@repo/api';
import type { ReportsResponseDto } from '@repo/api';
import { ReportData, createReportFormData } from '@/types/report';

export async function getReports(): Promise<Report[]> {
  const response = await apiFetch<ReportsResponseDto>('/reports/', {
    method: 'GET',
  });
  return response.data;
}

export async function postReportWithImages(reportData: ReportData) {
  const formData = createReportFormData(reportData);

  const res = await apiFetch('/reports/', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  return res;
}
