import { apiFetch } from '../client';
import type { Report } from '@repo/api';
import type { ReportResponseDto, ReportsResponseDto } from '@repo/api';
import { ReportData, createReportFormData } from '@/types/report';

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
