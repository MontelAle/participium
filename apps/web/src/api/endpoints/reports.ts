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

  const res = await fetch('http://localhost:5000/api/reports/', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Network error' }));
    const errorMessage = Array.isArray(error.message)
      ? error.message[0]
      : error.message || `Request failed with status ${res.status}`;
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function updateReport(
  reportId: string,
  data: UpdateReportDto,
): Promise<ReportResponseDto> {
  const response = await apiFetch<ReportResponseDto>(`/reports/${reportId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response;
}

export async function getReport(reportId: string): Promise<Report> {
  const response = await apiFetch<ReportResponseDto>(`/reports/${reportId}`, {
    method: 'GET',
  });

  return response.data;
}
