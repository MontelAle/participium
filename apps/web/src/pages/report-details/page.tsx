import { useParams, Navigate } from 'react-router-dom';
import { ReportDetails } from '@/components/report/report-details';
import { useReport } from '@/hooks/use-reports';

function ReportDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: report, isLoading, isError } = useReport(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading report...</div>
      </div>
    );
  }

  if (isError || !report) {
    return <Navigate to="/" replace />;
  }

  return <ReportDetails report={report} />;
}

export default ReportDetailsPage;
