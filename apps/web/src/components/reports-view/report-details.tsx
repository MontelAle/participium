import { ReportView } from '@/components/shared/report-view';
import type { Report } from '@/types';

interface ReportDetailsProps {
  report: Report;
}

export function ReportDetails({ report }: Readonly<ReportDetailsProps>) {
  return <ReportView report={report} showAnonymous />;
}
