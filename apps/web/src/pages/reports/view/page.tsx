import { ReportDetailLayout } from '@/components/reports/report-detail-layout';
import { ReportMessages } from '@/components/shared/report-messages';
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
        <>
          <ReportView report={report} />
          <div className="mt-6">
            <ReportMessages reportId={id!} />
          </div>
        </>
      )}
    </ReportDetailLayout>
  );
}

export default ReportDetailsPage;
