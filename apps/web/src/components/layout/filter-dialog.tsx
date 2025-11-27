import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { SlidersHorizontal, CalendarIcon } from 'lucide-react';
import { ReportStatus } from '@repo/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

type FilterState = {
  status: string | null;
  category: string | null;
  dateRange: string | null;
  customDate: DateRange | undefined;
};

type FilterDialogProps = {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  categories: string[];
};

export function FilterDialog({
  filters: parentFilters,
  setFilters: setParentFilters,
  categories,
}: FilterDialogProps) {
  const [open, setOpen] = useState(false);

  const [localFilters, setLocalFilters] = useState<FilterState>(parentFilters);

  useEffect(() => {
    if (open) {
      setLocalFilters(parentFilters);
    }
  }, [open, parentFilters]);

  const activeParentFiltersCount =
    (parentFilters.status ? 1 : 0) +
    (parentFilters.category ? 1 : 0) +
    (parentFilters.dateRange || parentFilters.customDate ? 1 : 0);

  const activeLocalFiltersCount =
    (localFilters.status ? 1 : 0) +
    (localFilters.category ? 1 : 0) +
    (localFilters.dateRange || localFilters.customDate ? 1 : 0);

  const hasActiveParentFilters = activeParentFiltersCount > 0;
  const hasActiveLocalFilters = activeLocalFiltersCount > 0;

  const handleApply = () => {
    setParentFilters(localFilters);
    setOpen(false);
  };

  const handlePresetToggle = (range: string) => {
    const isSelected = localFilters.dateRange === range;
    setLocalFilters((prev) => ({
      ...prev,
      dateRange: isSelected ? null : range,
      customDate: undefined,
    }));
  };

  const handleCustomDateSelect = (date: DateRange | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      customDate: date,
      dateRange: null,
    }));
  };

  const activeBtnClass =
    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm ring-1 ring-primary/20';
  const inactiveBtnClass = 'bg-muted text-muted-foreground hover:bg-muted/80';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative inline-flex">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-9 w-12 shrink-0 rounded-r-md rounded-l-none border-l transition-colors',
              hasActiveParentFilters
                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : 'hover:bg-muted',
            )}
          >
            <SlidersHorizontal className="size-5" />
          </Button>
          {hasActiveParentFilters && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-md animate-in zoom-in">
              {activeParentFiltersCount}
            </span>
          )}
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] rounded-2xl p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Filter Results
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-8 py-2">
          <div className="space-y-3">
            <Label className="text-base font-medium">Category</Label>
            <Select
              value={localFilters.category || 'all'}
              onValueChange={(val) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  category: val === 'all' ? null : val,
                }))
              }
            >
              <SelectTrigger className="w-full h-11 text-base rounded-lg">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-base">
                  All Categories
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-base">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Status</Label>
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="ghost"
                className={`rounded-full h-9 px-4 text-sm font-medium transition-all ${!localFilters.status ? activeBtnClass : inactiveBtnClass}`}
                onClick={() =>
                  setLocalFilters((prev) => ({ ...prev, status: null }))
                }
              >
                All
              </Button>
              {Object.values(ReportStatus).map((status) => (
                <Button
                  key={status}
                  variant="ghost"
                  className={`rounded-full h-9 px-4 text-sm font-medium capitalize transition-all ${localFilters.status === status ? activeBtnClass : inactiveBtnClass}`}
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      status: prev.status === status ? null : status,
                    }))
                  }
                >
                  {status.replaceAll(/_/g, ' ').toLowerCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Date</Label>
              {(localFilters.dateRange || localFilters.customDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      dateRange: null,
                      customDate: undefined,
                    }))
                  }
                >
                  Reset Date
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5">
              {['Today', 'Last Week', 'This Month'].map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  className={cn(
                    'rounded-full h-9 px-4 text-sm font-medium transition-all border border-transparent',
                    localFilters.dateRange === range
                      ? activeBtnClass
                      : inactiveBtnClass,
                  )}
                  onClick={() => handlePresetToggle(range)}
                >
                  {range}
                </Button>
              ))}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="ghost"
                    className={cn(
                      'rounded-full h-9 px-4 text-sm font-medium transition-all border border-transparent group',
                      localFilters.customDate
                        ? activeBtnClass
                        : inactiveBtnClass,
                    )}
                  >
                    <CalendarIcon
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        localFilters.customDate
                          ? 'opacity-100'
                          : 'opacity-50 group-hover:opacity-100',
                      )}
                    />

                    {localFilters.customDate?.from ? (
                      localFilters.customDate.to ? (
                        <>
                          {format(localFilters.customDate.from, 'MMM dd')} -{' '}
                          {format(localFilters.customDate.to, 'MMM dd')}
                        </>
                      ) : (
                        format(localFilters.customDate.from, 'MMM dd, y')
                      )
                    ) : (
                      <span>Select Dates</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={localFilters.customDate?.from}
                    selected={localFilters.customDate}
                    onSelect={handleCustomDateSelect}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-3 mt-4">
          <Button
            variant="secondary"
            className="flex-1 h-11 text-base rounded-lg"
            onClick={() =>
              setLocalFilters({
                status: null,
                category: null,
                dateRange: null,
                customDate: undefined,
              })
            }
            disabled={!hasActiveLocalFilters}
          >
            Clear Filters ({activeLocalFiltersCount})
          </Button>

          <Button
            className="flex-1 h-11 text-base rounded-lg shadow-md"
            onClick={handleApply}
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
