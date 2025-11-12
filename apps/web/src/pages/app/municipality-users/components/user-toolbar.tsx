import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, X } from 'lucide-react';
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

export type UsersToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  selectedRoles: string[];
  onRolesChange: (roles: string[]) => void;
  availableRoles: string[];
  className?: string;
};

export function UsersToolbar({
  query,
  onQueryChange,
  selectedRoles,
  onRolesChange,
  availableRoles,
  className,
}: UsersToolbarProps) {
  const [open, setOpen] = React.useState(false);

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

  const clearRoles = React.useCallback(
    () => onRolesChange([]),
    [onRolesChange],
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
          placeholder="Search by username…"
          className="h-9"
          aria-label="Search by username"
        />
      </div>

      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="h-9 min-w-[180px] justify-between"
            >
              {selectedRoles.length > 0
                ? `${selectedRoles.length} role(s)`
                : 'Filter by role'}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="end">
            <Command>
              <CommandInput placeholder="Search role…" />
              <CommandList>
                <CommandEmpty>No roles found.</CommandEmpty>
                <CommandGroup>
                  {availableRoles.map((role) => {
                    const checked = selectedRoles.includes(role);
                    return (
                      <CommandItem
                        key={role}
                        onSelect={() => toggleRole(role)}
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
                        {role
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map(
                            (w) =>
                              w.charAt(0).toUpperCase() +
                              w.slice(1).toLowerCase(),
                          )
                          .join(' ')}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedRoles.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={clearRoles}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
