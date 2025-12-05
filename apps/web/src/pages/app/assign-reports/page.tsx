import * as React from 'react';
import { useReports } from '@/hooks/use-reports';
import { useNavigate } from 'react-router-dom';
import { Toolbar } from '@/components/assign-reports/toolbar';
import { ReportsTable } from '@/components/assign-reports/report-list-table';

const AssignReportsPage = () => {
  const { data: reports = [] } = useReports();
  const navigate = useNavigate();

  const [query, setQuery] = React.useState('');
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    [],
  );

  const availableStatuses = React.useMemo(() => {
    const setStatus = new Set<string>();
    for (const r of reports) {
      if (r.status) setStatus.add(r.status);
    }
    return Array.from(setStatus).sort();
  }, [reports]);

  const availableCategories = React.useMemo(() => {
    const setCategories = new Set<string>();
    for (const r of reports) {
      if (r.category?.name) setCategories.add(r.category.name);
    }
    return Array.from(setCategories).sort();
  }, [reports]);

  const filteredReports = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reports.filter((r) => {
      const matchesQuery =
        !normalizedQuery ||
        String(r.title ?? '')
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(r.status);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(r.category?.name ?? '');

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [reports, query, selectedStatuses, selectedCategories]);

  const handleViewReport = (report: any) => {
    navigate(`/app/reports/${report.id}`);
  };

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
        <Toolbar
          query={query}
          onQueryChange={setQuery}
          selectedStatuses={selectedStatuses}
          onStatusesChange={setSelectedStatuses}
          availableStatuses={availableStatuses}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          availableCategories={availableCategories}
        />
      </div>
      <div className="overflow-hidden">
        <ReportsTable data={filteredReports} viewBasePath="/app/assign-reports/view" />
      </div>
    </div>
  );
};

export default AssignReportsPage;
