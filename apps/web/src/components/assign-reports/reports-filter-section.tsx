import * as React from 'react';
import { Toolbar } from '@/components/assign-reports/toolbar';

interface ReportsFilterSectionProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedStatuses: string[];
  onStatusesChange: (statuses: string[]) => void;
  availableStatuses: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  availableCategories: string[];
}

export const ReportsFilterSection: React.FC<ReportsFilterSectionProps> = ({
  query,
  onQueryChange,
  selectedStatuses,
  onStatusesChange,
  availableStatuses,
  selectedCategories,
  onCategoriesChange,
  availableCategories,
}) => {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Toolbar
        query={query}
        onQueryChange={onQueryChange}
        selectedStatuses={selectedStatuses}
        onStatusesChange={onStatusesChange}
        availableStatuses={availableStatuses}
        selectedCategories={selectedCategories}
        onCategoriesChange={onCategoriesChange}
        availableCategories={availableCategories}
      />
    </div>
  );
}