import { ReportView } from '@/components/shared/report-view';
import type { Report } from '@repo/api';

type ViewReportFormProps = {
  report: Report;
};

export function ViewReportForm({ report }: ViewReportFormProps) {
  return <ReportView report={report} showAnonymous={false} />;
}
