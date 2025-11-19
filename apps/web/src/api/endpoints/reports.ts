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


export async function postReportWithImages(reportData: {
  title: string;
  description: string;
  longitude: number;
  latitude: number;
  address?: string;
  categoryId: string;
  photos: File[];
}) {
  const formData = new FormData();

formData.append('title', reportData.title);
formData.append('description', reportData.description);
formData.append('longitude', String(reportData.longitude));
formData.append('latitude', String(reportData.latitude));
if (reportData.address) formData.append('address', reportData.address);
formData.append('categoryId', reportData.categoryId);

  reportData.photos.forEach((photo) => {
    formData.append('images', photo); 
  });

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
