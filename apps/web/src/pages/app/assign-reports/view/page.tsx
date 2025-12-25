import { ReviewReportForm } from '@/components/assign-reports/review-report-form';
import { ReportDetailLayout } from '@/components/reports/report-detail-layout';
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
        <ReviewReportForm report={report} onClose={() => navigate(-1)} />
      )}
    </ReportDetailLayout>
  );
}

export default AssignReportsViewPage;
