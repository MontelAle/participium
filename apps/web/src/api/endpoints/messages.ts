import type { Message } from '@/types';
import { apiFetch } from '../client';

export async function getReportMessages(reportId: string): Promise<Message[]> {
  const response = await apiFetch<{ success: boolean; data: Message[] }>(
    `/reports/${reportId}/messages`,
    { method: 'GET' },
  );
  return response.data;
}

export async function postReportMessage(
  reportId: string,
  content: string,
): Promise<Message> {
  const response = await apiFetch<{ success: boolean; data: Message }>(
    `/reports/${reportId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  );
  return response.data;
}
