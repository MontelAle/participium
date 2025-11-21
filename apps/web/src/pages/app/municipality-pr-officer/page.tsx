import * as React from 'react';
import { ReportsTable } from './components/report-list-table';
import { useReports } from '@/hooks/use-reports';
import { useNavigate } from 'react-router-dom';
import { PrOfficerToolbar } from './components/pr-officer-toolbar'; // Toolbar aggiornata

const MunicipalityPrOfficerPage = () => {
  const { data: reports = [] } = useReports();
  const navigate = useNavigate();

  // Stato della ricerca e dei filtri
  const [query, setQuery] = React.useState('');
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

  // Recupero valori unici per i filtri
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

  // Filtro dei dati
  const filteredReports = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reports.filter((r) => {
      const matchesQuery =
        !normalizedQuery ||
        String(r.title ?? '').toLowerCase().includes(normalizedQuery);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Reports for Officer
        </h1>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <PrOfficerToolbar
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

      <ReportsTable data={filteredReports}  />
    </div>
  );
};

export default MunicipalityPrOfficerPage;
