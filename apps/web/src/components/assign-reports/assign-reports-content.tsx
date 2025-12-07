import * as React from 'react';
import { ReportsHeader } from '@/components/assign-reports/reports-header';
import { ReportsFilterSection } from '@/components/assign-reports/reports-filter-section';
import { ReportsTableSection } from '@/components/assign-reports/reports-table-section';

interface AssignReportsContentProps {
  reports: any[];
  title?: string;
  description?: string;
  viewBasePath?: string;
}

export const AssignReportsContent: React.FC<AssignReportsContentProps> = ({
  reports = [],
  title = 'Assign Reports',
  description = 'Review and assign reports to municipal users.',
  viewBasePath = '/app/assign-reports/view',
}) => {
  const [query, setQuery] = React.useState('');
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <ReportsHeader title={title} description={description} />

      <ReportsFilterSection
        query={query}
        onQueryChange={setQuery}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
        availableStatuses={availableStatuses}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        availableCategories={availableCategories}
      />

      <ReportsTableSection data={filteredReports} viewBasePath={viewBasePath} />
    </div>
  );
};