import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
}: ToolbarProps) {
  const [openStatus, setOpenStatus] = React.useState(false);
  const [openCategory, setOpenCategory] = React.useState(false);

  const toggleStatus = React.useCallback(
    (status: string) => {
      onStatusesChange(
        selectedStatuses.includes(status)
          ? selectedStatuses.filter((s) => s !== status)
          : [...selectedStatuses, status],
      );
    },
    [onStatusesChange, selectedStatuses],
  );

  const toggleCategory = React.useCallback(
    (category: string) => {
      onCategoriesChange(
        selectedCategories.includes(category)
          ? selectedCategories.filter((c) => c !== category)
          : [...selectedCategories, category],
      );
    },
    [onCategoriesChange, selectedCategories],
  );

  const clearStatuses = React.useCallback(
    () => onStatusesChange([]),
    [onStatusesChange],
  );

  const clearCategories = React.useCallback(
    () => onCategoriesChange([]),
    [onCategoriesChange],
  );

  return (
    <div
      className={cn(
        'flex flex-col gap-3 md:flex-row md:items-center',
        className,
      )}
    >
      <div className="flex-1">
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by report title…"
          className="h-9"
          aria-label="Search by report title"
        />
      </div>

      <div className="flex items-center gap-2">
        <Popover open={openStatus} onOpenChange={setOpenStatus}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openStatus}
              className="h-9 min-w-[160px] justify-between"
            >
              {selectedStatuses.length > 0
                ? `${selectedStatuses.length} status(s)`
                : 'Filter by status'}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="end">
            <Command>
              <CommandInput placeholder="Search status…" />
              <CommandList>
                <CommandEmpty>No status found.</CommandEmpty>
                <CommandGroup>
                  {availableStatuses.map((status) => {
                    const checked = selectedStatuses.includes(status);
                    return (
                      <CommandItem
                        key={status}
                        onSelect={() => toggleStatus(status)}
                        className="cursor-pointer"
                        aria-checked={checked}
                        role="checkbox"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            checked ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {status.replaceAll(/_/g, ' ')}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedStatuses.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={clearStatuses}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Popover open={openCategory} onOpenChange={setOpenCategory}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openCategory}
              className="h-9 min-w-[160px] justify-between"
            >
              {selectedCategories.length > 0
                ? `${selectedCategories.length} category(s)`
                : 'Filter by category'}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="end">
            <Command>
              <CommandInput placeholder="Search category…" />
              <CommandList>
                <CommandEmpty>No categories found.</CommandEmpty>
                <CommandGroup>
                  {availableCategories.map((category) => {
                    const checked = selectedCategories.includes(category);
                    return (
                      <CommandItem
                        key={category}
                        onSelect={() => toggleCategory(category)}
                        className="cursor-pointer"
                        aria-checked={checked}
                        role="checkbox"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            checked ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {category}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedCategories.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={clearCategories}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
