import { ReportsTable } from '@/components/assigned-reports/assignedReportTable';
import { useReports } from '@/hooks/use-reports';

const AssignedReportsPage = () => {
  const { data: reports = [], isLoading } = useReports(); // Recupera i report dal server

  if (isLoading) return <div>Loading...</div>;
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <ReportsTable data={reports} />
    </div>
  );
};

export default AssignedReportsPage;
