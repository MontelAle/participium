import { ReviewReportForm } from '@/components/assign-reports/review-report-form';
import { ReportDetailLayout } from '@/components/reports/report-detail-layout';
import { ReportComments } from '@/components/shared/report-comments';
import { useReport } from '@/hooks/use-reports';
import { useNavigate, useParams } from 'react-router-dom';

function AssignReportsViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, isError } = useReport(id!);

  return (
    <ReportDetailLayout
      report={report}
      isLoading={isLoading}
      isError={isError}
      fallbackRoute="/reports"
    >
      {report && (
        <div className="flex flex-col gap-6">
          <ReviewReportForm report={report} onClose={() => navigate(-1)} />
          <ReportComments reportId={id!} />
        </div>
      )}
    </ReportDetailLayout>
  );
}

export default AssignReportsViewPage;
