import { apiFetch } from '../client';
import type { Report } from '@repo/api';
import type { ReportResponseDto, ReportsResponseDto } from '@repo/api';
import { CreateReportDto } from '@repo/api';

export async function getReports(): Promise<Report[]> {
  const response = await apiFetch<ReportsResponseDto>('/reports/', {
    method: 'GET',
  });
  return response.data;
}

export async function postReport(
  reportData: Partial<CreateReportDto>,
): Promise<Report> {
  const response = await apiFetch<ReportResponseDto>('/reports/', {
    method: 'POST',
    body: JSON.stringify(reportData),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}
