import { ViewAssignedReport } from '@/components/assigned-reports/view-report-form';
import { ReportDetailLayout } from '@/components/reports/report-detail-layout';
import { ReportComments } from '@/components/shared/report-comments';
import { useReport } from '@/hooks/use-reports';
import { useNavigate, useParams } from 'react-router-dom';

function AssignedReportsViewPage() {
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
        <ViewAssignedReport
          report={report}
          showAnonymous={false}
          onClose={() => navigate(-1)}
        />
      )}
      <ReportComments reportId={id!} />
    </ReportDetailLayout>
  );
}

export default AssignedReportsViewPage;
