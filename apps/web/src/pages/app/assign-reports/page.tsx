import { ReportsTable } from '@/components/assign-reports/report-list-table';
import { Toolbar } from '@/components/assign-reports/toolbar';
import { useAuth } from '@/contexts/auth-context';
import { useReports } from '@/hooks/use-reports';
import { useMemo, useState } from 'react';

const AssignReportsPage = () => {
  const { data: reports = [] } = useReports();
  const { isMunicipalPrOfficer } = useAuth();

  const [query, setQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const availableStatuses = useMemo(() => {
    if (isMunicipalPrOfficer) {
      return [];
    }
    const setStatus = new Set<string>();
    for (const r of reports) {
      if (r.status) setStatus.add(r.status);
    }
    return Array.from(setStatus).sort();
  }, [reports, isMunicipalPrOfficer]);

  const availableCategories = useMemo(() => {
    const setCategories = new Set<string>();
    for (const r of reports) {
      if (r.category?.name) setCategories.add(r.category.name);
    }
    return Array.from(setCategories).sort();
  }, [reports]);

  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reports.filter((r) => {
      const matchesQuery =
        !normalizedQuery ||
        String(r.title ?? '')
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        isMunicipalPrOfficer ||
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(r.status);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(r.category?.name ?? '');

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [
    reports,
    query,
    selectedStatuses,
    selectedCategories,
    isMunicipalPrOfficer,
  ]);

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
        <ReportsTable data={filteredReports} />
      </div>
    </div>
  );
};

export default AssignReportsPage;
