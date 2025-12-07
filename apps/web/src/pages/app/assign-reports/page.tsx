import { AssignReportsContent } from '@/components/assign-reports/assign-reports-content';
import { useReports } from '@/hooks/use-reports';

const AssignReportsPage = () => {
  const { data: reports = [] } = useReports();

  return (
    <AssignReportsContent 
      reports={reports}
      title="Assign Reports"
      description="Review and assign reports to municipal users."
      viewBasePath="/app/assign-reports/view"
    />
  );
};

export default AssignReportsPage;