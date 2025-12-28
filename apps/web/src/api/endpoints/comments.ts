import type { Comment } from '@/types';
import { apiFetch } from '../client';

export async function getReportComments(reportId: string): Promise<Comment[]> {
  const response = await apiFetch<{ success: boolean; data: Comment[] }>(
    `/reports/${reportId}/comments`,
    { method: 'GET' },
  );
  return response.data;
}

export async function postReportComment(
  reportId: string,
  content: string,
): Promise<Comment> {
  const response = await apiFetch<{ success: boolean; data: Comment }>(
    `/reports/${reportId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  );
  return response.data;
}
