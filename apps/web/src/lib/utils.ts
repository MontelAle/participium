import type { ReportStatus } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStatusConfig = (status: ReportStatus) => {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        color:
          'bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200',
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        color:
          'bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200',
      };
    case 'resolved':
      return {
        label: 'Resolved',
        color:
          'bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        color: 'bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200',
      };
    case 'assigned':
      return {
        label: 'Assigned',
        color:
          'bg-red-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-200',
      };
    case 'suspended':
      return {
        label: 'Suspended',
        color:
          'bg-gray-500/15 text-gray-700 hover:bg-gray-500/25 border-gray-200',
      };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700' };
  }
};

export const prettifyRole = (name: string) =>
  name
    .replaceAll('_', ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

export const prettifyStatus = (status: string) =>
  status
    .replaceAll('_', ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
