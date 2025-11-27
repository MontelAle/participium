import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Check,
  ChevronsUpDown,
  Search,
  X,
  Filter,
  Building2,
  RotateCcw,
  Briefcase,
} from 'lucide-react';
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
import { cn, prettifyRole } from '@/lib/utils';
import { UsersToolbarProps } from '@/types/ui';

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
}: UsersToolbarProps) {
  const [openRoles, setOpenRoles] = React.useState(false);
  const [openOffices, setOpenOffices] = React.useState(false);

  const toggleRole = React.useCallback(
    (role: string) => {
      onRolesChange(
        selectedRoles.includes(role)
          ? selectedRoles.filter((r) => r !== role)
          : [...selectedRoles, role],
      );
    },
    [onRolesChange, selectedRoles],
  );

  const toggleOffice = React.useCallback(
    (office: string) => {
      onOfficesChange(
        selectedOffices.includes(office)
          ? selectedOffices.filter((o) => o !== office)
          : [...selectedOffices, office],
      );
    },
    [onOfficesChange, selectedOffices],
  );

  const clearAll = React.useCallback(() => {
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
          <Popover open={openRoles} onOpenChange={setOpenRoles}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="h-12 w-full lg:w-[200px] justify-between text-base border-slate-200 px-4"
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <Briefcase className="h-4 w-4 shrink-0 opacity-50" />
                  <span className="truncate">
                    {selectedRoles.length > 0
                      ? `${selectedRoles.length} role${selectedRoles.length > 1 ? 's' : ''}`
                      : 'Filter by role'}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-(--radix-popover-trigger-width) min-w-[200px] p-0"
              align="start"
            >
              <Command>
                <CommandInput
                  placeholder="Search role..."
                  className="h-10 text-base"
                />
                <CommandList>
                  <CommandEmpty>No roles found</CommandEmpty>
                  <CommandGroup>
                    {availableRoles.map((role) => {
                      const checked = selectedRoles.includes(role);
                      return (
                        <CommandItem
                          key={role}
                          onSelect={() => toggleRole(role)}
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
                          <span className="truncate">{prettifyRole(role)}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Popover open={openOffices} onOpenChange={setOpenOffices}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="h-12 w-full lg:w-[220px] justify-between text-base border-slate-200 px-4"
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <Building2 className="h-4 w-4 shrink-0 opacity-50" />
                  <span className="truncate">
                    {selectedOffices.length > 0
                      ? `${selectedOffices.length} office${selectedOffices.length > 1 ? 's' : ''}`
                      : 'Filter by office'}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-(--radix-popover-trigger-width) min-w-[220px] p-0"
              align="start"
            >
              <Command>
                <CommandInput
                  placeholder="Search office..."
                  className="h-10 text-base"
                />
                <CommandList>
                  <CommandEmpty>No offices found</CommandEmpty>
                  <CommandGroup>
                    {availableOffices.map((officeLabel) => {
                      const checked = selectedOffices.includes(officeLabel);
                      return (
                        <CommandItem
                          key={officeLabel}
                          onSelect={() => toggleOffice(officeLabel)}
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
                          <span className="truncate">{officeLabel}</span>
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
