import { Toolbar } from '@/components/assign-reports/toolbar';
import type { useReportFiltering } from '@/hooks/use-report-filtering';

type FilterState = ReturnType<typeof useReportFiltering>;

interface ReportsFilterToolbarProps {
  state: FilterState;
  className?: string;
}

export function ReportsFilterToolbar({
  state,
  className,
}: ReportsFilterToolbarProps) {
  return (
    <div className={className}>
      <Toolbar
        query={state.query}
        onQueryChange={state.setQuery}
        selectedStatuses={state.selectedStatuses}
        onStatusesChange={state.setSelectedStatuses}
        availableStatuses={state.availableStatuses}
        selectedCategories={state.selectedCategories}
        onCategoriesChange={state.setSelectedCategories}
        availableCategories={state.availableCategories}
      />
    </div>
  );
}
