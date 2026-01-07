import { ViewAssignedReport } from '@/components/assigned-reports/view-report-form';
import { ReportDetailLayout } from '@/components/reports/report-detail-layout';
import ReportDiscussion from '@/components/shared/report-discussion';
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
        <div className="grid gap-4 md:grid-cols-4 items-start">
          <ViewAssignedReport
            report={report}
            showAnonymous={false}
            onClose={() => navigate(-1)}
            className="md:col-span-3"
          />
          <ReportDiscussion reportId={id!} />
        </div>
      )}
    </ReportDetailLayout>
  );
}

export default AssignedReportsViewPage;
