import { apiFetch } from '../client';
import type { Report } from '@repo/api';
import type { ReportResponse } from '@/types/report';
import { CreateReportDto } from '@repo/api';

export async function getReports(): Promise<Report[]> {
  const response = await apiFetch<ReportResponse>('/roles/', {
    method: 'GET',
  });
  return response.data;
}

export async function postReport(
  reportData: Partial<CreateReportDto>,
): Promise<Report> {
  const response = await apiFetch<{ success: boolean; data: Report }>(
    '/reports/',
    {
      method: 'POST',
      body: JSON.stringify(reportData),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return response.data;
}
