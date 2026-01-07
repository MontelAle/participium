import { ReportDetailLayout } from '@/components/reports/report-detail-layout';
import ReportDiscussion from '@/components/shared/report-discussion';
import { ReportView } from '@/components/shared/report-view';
import { useReport } from '@/hooks/use-reports';
import { useParams } from 'react-router-dom';

function ReportDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: report, isLoading, isError } = useReport(id!);

  return (
    <ReportDetailLayout
      report={report}
      isLoading={isLoading}
      isError={isError}
      fallbackRoute="/"
    >
      {report && (
        <div className="grid md:grid-cols-4 gap-4">
          <ReportView report={report} className="md:col-span-3" />
          <ReportDiscussion reportId={report.id} showComments={false} />
        </div>
      )}
    </ReportDetailLayout>
  );
}

export default ReportDetailsPage;
