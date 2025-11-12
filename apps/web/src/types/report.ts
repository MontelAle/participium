import { Report } from '@repo/api';

export type ReportResponse = {
  success: boolean;
  data: Report[];
};
