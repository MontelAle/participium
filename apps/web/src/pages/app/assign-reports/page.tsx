import { ReportsTable } from '@/components/assign-reports/report-list-table';
import { ReportsFilterToolbar } from '@/components/shared/reports-filter-toolbar';
import { useReportFiltering } from '@/hooks/use-report-filtering';
import { useReports } from '@/hooks/use-reports';

const AssignReportsPage = () => {
  const { data: reports = [] } = useReports();

  const filterLogic = useReportFiltering(reports);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Assign Reports
          </h1>
          <p className="text-lg text-muted-foreground">
            Review and assign reports to municipal users.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <ReportsFilterToolbar state={filterLogic} />
      </div>

      <div className="overflow-hidden">
        <ReportsTable
          data={filterLogic.filteredData}
          viewBasePath="/app/assign-reports/view"
        />
      </div>
    </div>
  );
};

export default AssignReportsPage;
