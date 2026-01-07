import { ReportsTable } from '@/components/assigned-reports/assignedReportTable';
import { ReportsFilterToolbar } from '@/components/shared/reports-filter-toolbar';
import { useAuth } from '@/contexts/auth-context';
import { useReportFiltering } from '@/hooks/use-report-filtering';
import { useReports } from '@/hooks/use-reports';
import { useMemo } from 'react';

const ExternalPage = () => {
  const { data: reports = [] } = useReports();
  const { user } = useAuth();

  const myExternalReports = useMemo(() => {
    if (!user) return [];
    return reports.filter(
      (report) => report.assignedExternalMaintainerId === user.id,
    );
  }, [reports, user]);

  const filterLogic = useReportFiltering(myExternalReports);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            External Maintainer Tasks
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage reports assigned to your organization.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <ReportsFilterToolbar state={filterLogic} />
      </div>

      <div className="overflow-hidden">
        <ReportsTable
          data={filterLogic.filteredData}
          viewBasePath="/app/external/assigned-reports"
        />
      </div>
    </div>
  );
};

export default ExternalPage;
