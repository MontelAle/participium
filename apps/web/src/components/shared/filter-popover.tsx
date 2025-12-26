import { Button } from '@/components/ui/button';
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
import { FilterPopoverProps } from '@/types/ui';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

export function FilterPopover({
  title,
  options,
  selected,
  onSelect,
  icon: Icon,
  formatLabel = (s) => s,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found',
  width = 'w-[200px]',
}: Readonly<FilterPopoverProps>) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-12 justify-between text-base border-slate-200 px-4',
            width,
          )}
        >
          <div className="flex items-center gap-2 truncate mr-2">
            {Icon && <Icon className="h-4 w-4 shrink-0 opacity-50" />}
            <span className="truncate">
              {selected.length > 0 ? `${selected.length} selected` : title}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('p-0', width)} align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-10 text-base"
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const checked = selected.includes(option);
                return (
                  <CommandItem
                    key={option}
                    onSelect={() => onSelect(option)}
                    className="cursor-pointer py-3 text-base"
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
                    <span className="truncate">{formatLabel(option)}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
