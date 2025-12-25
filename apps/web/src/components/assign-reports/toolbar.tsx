import { FilterPopover } from '@/components/shared/filter-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { RotateCcw, Search, X } from 'lucide-react';
import { useCallback } from 'react';

export type ToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  selectedStatuses: string[];
  onStatusesChange: (statuses: string[]) => void;
  availableStatuses: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  availableCategories: string[];
  className?: string;
};

export function Toolbar({
  query,
  onQueryChange,
  selectedStatuses,
  onStatusesChange,
  availableStatuses,
  selectedCategories,
  onCategoriesChange,
  availableCategories,
  className,
}: Readonly<ToolbarProps>) {
  const toggleStatus = useCallback(
    (status: string) => {
      onStatusesChange(
        selectedStatuses.includes(status)
          ? selectedStatuses.filter((s) => s !== status)
          : [...selectedStatuses, status],
      );
    },
    [onStatusesChange, selectedStatuses],
  );

  const toggleCategory = useCallback(
    (category: string) => {
      onCategoriesChange(
        selectedCategories.includes(category)
          ? selectedCategories.filter((c) => c !== category)
          : [...selectedCategories, category],
      );
    },
    [onCategoriesChange, selectedCategories],
  );

  const clearAll = useCallback(() => {
    onStatusesChange([]);
    onCategoriesChange([]);
  }, [onStatusesChange, onCategoriesChange]);

  const hasFilters =
    selectedStatuses.length > 0 || selectedCategories.length > 0;

  const showStatusFilter = availableStatuses.length > 0;

  return (
    <div className={cn('flex flex-col gap-4 w-full', className)}>
      <div className="flex flex-col xl:flex-row gap-4 w-full">
        <div className="relative w-full xl:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search reports..."
            className="h-12 pl-10 text-base w-full"
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-4 w-full xl:w-auto">
          {showStatusFilter && (
            <FilterPopover
              title="Filter by status"
              options={availableStatuses}
              selected={selectedStatuses}
              onSelect={toggleStatus}
              formatLabel={(s) => s.replaceAll('_', ' ')}
              searchPlaceholder="Search status..."
              emptyMessage="No statuses found"
              width="w-full lg:w-[200px]"
            />
          )}

          <FilterPopover
            title="Filter by category"
            options={availableCategories}
            selected={selectedCategories}
            onSelect={toggleCategory}
            searchPlaceholder="Search category..."
            emptyMessage="No categories found"
            width="w-full lg:w-[220px]"
          />

          {hasFilters && (
            <Button
              variant="ghost"
              size="lg"
              className="h-12 px-4 text-base text-muted-foreground hover:text-destructive w-full lg:w-auto col-span-1 sm:col-span-2 lg:col-span-1"
              onClick={clearAll}
            >
              <RotateCcw className="h-4 w-4 mr-2 sm:hidden" />
              <span className="sm:hidden">Reset Filters</span>
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
