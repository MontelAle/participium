import { ReportStatus } from '@repo/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStatusConfig = (status: ReportStatus) => {
  switch (status) {
    case ReportStatus.PENDING:
      return {
        label: 'Pending',
        color:
          'bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200',
      };
    case ReportStatus.IN_PROGRESS:
      return {
        label: 'In Progress',
        color:
          'bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200',
      };
    case ReportStatus.RESOLVED:
      return {
        label: 'Resolved',
        color:
          'bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200',
      };
    case ReportStatus.REJECTED:
      return {
        label: 'Rejected',
        color: 'bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200',
      };
    case ReportStatus.ASSIGNED:
      return {
        label: 'Assigned',
        color: 'bg-red-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-200',
      };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700' };
  }
};

export const prettifyRole = (name: string) =>
  name
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
