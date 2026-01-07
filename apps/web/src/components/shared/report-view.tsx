import { ReportContentLayout } from '@/components/reports/report-content-layout';
import type { ReportViewProps } from '@/types/ui';

export function ReportView({
  report,
  showAnonymous = true,
  className,
}: Readonly<ReportViewProps>) {
  return (
    <ReportContentLayout
      report={report}
      showAnonymous={showAnonymous}
      className={className}
    />
  );
}
