import { FilterPopover } from '@/components/shared/filter-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, prettifyRole } from '@/lib/utils';
import type { UsersToolbarProps } from '@/types/ui';
import { Briefcase, Building2, RotateCcw, Search, X } from 'lucide-react';
import { useCallback } from 'react';

export function UsersToolbar({
  query,
  onQueryChange,
  selectedRoles,
  onRolesChange,
  availableRoles,
  selectedOffices,
  onOfficesChange,
  availableOffices,
  className,
}: Readonly<UsersToolbarProps>) {
  const toggleRole = useCallback(
    (role: string) => {
      onRolesChange(
        selectedRoles.includes(role)
          ? selectedRoles.filter((r) => r !== role)
          : [...selectedRoles, role],
      );
    },
    [onRolesChange, selectedRoles],
  );

  const toggleOffice = useCallback(
    (office: string) => {
      onOfficesChange(
        selectedOffices.includes(office)
          ? selectedOffices.filter((o) => o !== office)
          : [...selectedOffices, office],
      );
    },
    [onOfficesChange, selectedOffices],
  );

  const clearAll = useCallback(() => {
    onRolesChange([]);
    onOfficesChange([]);
  }, [onRolesChange, onOfficesChange]);

  const hasFilters = selectedRoles.length > 0 || selectedOffices.length > 0;

  return (
    <div className={cn('flex flex-col gap-4 w-full', className)}>
      <div className="flex flex-col xl:flex-row gap-4 w-full">
        <div className="relative w-full xl:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search users..."
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
          <FilterPopover
            title="Filter by role"
            options={availableRoles}
            selected={selectedRoles}
            onSelect={toggleRole}
            formatLabel={prettifyRole}
            icon={Briefcase}
            searchPlaceholder="Search role..."
            emptyMessage="No roles found"
            width="w-full lg:w-[200px]"
          />

          <FilterPopover
            title="Filter by office"
            options={availableOffices}
            selected={selectedOffices}
            onSelect={toggleOffice}
            icon={Building2}
            searchPlaceholder="Search office..."
            emptyMessage="No offices found"
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
