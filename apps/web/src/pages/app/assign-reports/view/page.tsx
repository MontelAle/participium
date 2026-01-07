import { ReviewReportForm } from '@/components/assign-reports/review-report-form';
import { ReportDetailLayout } from '@/components/reports/report-detail-layout';
import ReportDiscussion from '@/components/shared/report-discussion';
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
        <div className="grid gap-4 md:grid-cols-4 items-start">
          <ReviewReportForm
            report={report}
            onClose={() => navigate(-1)}
            className="md:col-span-3"
          />
          <ReportDiscussion reportId={id!} showMessages={false} />
        </div>
      )}
    </ReportDetailLayout>
  );
}

export default AssignReportsViewPage;
