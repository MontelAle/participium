import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, RotateCcw, Search, X } from 'lucide-react';
import { useCallback, useState } from 'react';

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
  const [openStatus, setOpenStatus] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);

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
            <Popover open={openStatus} onOpenChange={setOpenStatus}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 w-full lg:w-[200px] justify-between text-base border-slate-200 px-4"
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    <span className="truncate">
                      {selectedStatuses.length > 0
                        ? `${selectedStatuses.length} status${selectedStatuses.length > 1 ? 'es' : ''}`
                        : 'Filter by status'}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="min-w-[200px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search status..."
                    className="h-12 text-base"
                  />
                  <CommandList>
                    <CommandEmpty>No statuses found</CommandEmpty>
                    <CommandGroup>
                      {availableStatuses.map((status) => {
                        const checked = selectedStatuses.includes(status);
                        return (
                          <CommandItem
                            key={status}
                            onSelect={() => toggleStatus(status)}
                            className="cursor-pointer py-2 text-base"
                          >
                            <div
                              className={cn(
                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0',
                                checked
                                  ? 'bg-primary text-primary-foreground'
                                  : 'opacity-50 [&_svg]:invisible',
                              )}
                            >
                              <Check className="h-4 w-4" />
                            </div>
                            <span className="truncate">
                              {status.replaceAll('_', ' ')}
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
          <Popover open={openCategory} onOpenChange={setOpenCategory}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-12 w-full lg:w-[220px] justify-between text-base border-slate-200 px-4"
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <span className="truncate">
                    {selectedCategories.length > 0
                      ? `${selectedCategories.length} category${selectedCategories.length > 1 ? 'ies' : ''}`
                      : 'Filter by category'}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-[220px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search category..."
                  className="h-10 text-base"
                />
                <CommandList>
                  <CommandEmpty>No categories found</CommandEmpty>
                  <CommandGroup>
                    {availableCategories.map((category) => {
                      const checked = selectedCategories.includes(category);
                      return (
                        <CommandItem
                          key={category}
                          onSelect={() => toggleCategory(category)}
                          className="cursor-pointer py-4 text-base"
                        >
                          <div
                            className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0',
                              checked
                                ? 'bg-primary text-primary-foreground'
                                : 'opacity-50 [&_svg]:invisible',
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          <span className="truncate">{category}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
