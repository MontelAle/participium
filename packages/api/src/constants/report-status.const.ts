export const ReportStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  ASSIGNED: 'assigned',
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];
