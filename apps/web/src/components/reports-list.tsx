import { useReports } from '@/hooks/use-reports';
import { useActiveReportStore } from '@/store/activeReportStore';
import { useAuth } from '@/contexts/auth-context';
import type { Report } from '@repo/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getStatusConfig } from '@/lib/utils';
import { MapPin, CalendarDays } from 'lucide-react';
import { isSameDay, subWeeks, subMonths, parseISO, isAfter } from 'date-fns';
import { ReportsListProps } from '@/types/report';

export function ReportsList({
  searchTerm = '',
  onlyMyReports = false,
  advancedFilters,
}: ReportsListProps) {
  const { data: reports = [] } = useReports();
  const { user } = useAuth();
  const setLocation = useActiveReportStore((state) => state.setLocation);
  const filteredReports = reports.filter((report) => {
    if (onlyMyReports && user) {
      const reportUserId = report.userId;
      if (reportUserId !== user.id) return false;
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matches =
        report.title.toLowerCase().includes(term) ||
        (report.address && report.address.toLowerCase().includes(term)) ||
        report.category.name.toLowerCase().includes(term);
      if (!matches) return false;
    }

    if (advancedFilters) {
      if (advancedFilters.status && report.status !== advancedFilters.status)
        return false;

      if (
        advancedFilters.category &&
        report.category.name !== advancedFilters.category
      )
        return false;

      const reportDate = new Date(report.createdAt);
      const today = new Date();
      if (advancedFilters.dateRange) {
        if (advancedFilters.dateRange) {
          if (advancedFilters.dateRange === 'Today') {
            if (!isSameDay(reportDate, today)) return false;
          } else if (advancedFilters.dateRange === 'Last Week') {
            if (!isAfter(reportDate, subWeeks(today, 1))) return false;
          } else if (advancedFilters.dateRange === 'This Month') {
            if (!isAfter(reportDate, subMonths(today, 1))) return false;
          }
        }
      }
      if (advancedFilters.customDate?.from) {
        const { from, to } = advancedFilters.customDate;

        const cleanFrom = new Date(from);
        cleanFrom.setHours(0, 0, 0, 0);
        const cleanReportDate = new Date(reportDate);
        cleanReportDate.setHours(0, 0, 0, 0);

        if (cleanReportDate < cleanFrom) return false;

        if (to) {
          const cleanTo = new Date(to);
          cleanTo.setHours(23, 59, 59, 999);
          if (reportDate > cleanTo) return false;
        }
      }
    }

    return true;
  });

  const handleReportClick = (report: Report) => {
    setLocation({
      latitude: report.location.coordinates[1] ?? 0,
      longitude: report.location.coordinates[0] ?? 0,
      address: report.address,
      city: 'Unavailable Zone',
    });
  };

  if (filteredReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-4 text-center">
        <p className="font-medium">No results</p>
        <p className="text-sm mt-1">Try changing your filters or search</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      {' '}
      <p className="text-sm font-semibold text-muted-foreground text-right">
        {filteredReports.length} reports found
      </p>
      {filteredReports.map((report) => {
        const statusConfig = getStatusConfig(report.status);
        const formattedDate = new Date(report.createdAt).toLocaleDateString(
          'en-En',
          {
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
          },
        );

        return (
          <div
            key={report.id}
            className="group relative w-full rounded-lg border p-4 shadow-sm transition-all hover:shadow-md bg-white"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">
                Report #{report.id.slice(-6)}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-sm px-2 py-0.5 font-medium border',
                  statusConfig.color,
                )}
              >
                {statusConfig.label}
              </Badge>
            </div>

            <div className="mb-3">
              <h3 className="font-bold text-xl leading-tight text-foreground mb-1">
                {report.title}
              </h3>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {report.category.name}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3" />
                <span className="truncate max-w-[250px]">
                  {report.address || 'Indirizzo non disponibile'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <CalendarDays className="size-3" />
                <span className="capitalize">{formattedDate}</span>
              </div>
            </div>

            <div className="flex items-center justify-end mt-3 pt-3 border-t border-dashed">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-base rounded-md border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
                onClick={() => handleReportClick(report)}
              >
                Show on Map
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
