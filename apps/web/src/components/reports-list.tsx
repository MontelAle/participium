import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useFilteredReports } from '@/hooks/use-filtered-reports';
import { cn, getStatusConfig } from '@/lib/utils';
import { useActiveReportStore } from '@/store/activeReportStore';
import type { Report } from '@/types';
import type { ReportsListProps } from '@/types/report';
import { CalendarDays, Ghost, MapPin, Tag, User } from 'lucide-react';
import { type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export function ReportsList({
  setIsMobileExpanded = () => undefined,
}: Readonly<ReportsListProps>) {
  const { reports: baseFilteredReports } = useFilteredReports();
  const { isGuestUser } = useAuth();
  const navigate = useNavigate();
  const setLocation = useActiveReportStore((state) => state.setLocation);

  const sidebarReports = baseFilteredReports;

  const handleReportClick = (e: MouseEvent, report: Report) => {
    e.stopPropagation();
    setIsMobileExpanded(false);
    setLocation({
      latitude: report.location.coordinates[1] ?? 0,
      longitude: report.location.coordinates[0] ?? 0,
      address: report.address,
      city: 'Unavailable Zone',
    });
  };

  const handleShowDetails = (reportId: string) => {
    navigate(`/reports/view/${reportId}`);
  };

  if (sidebarReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-4 text-center">
        <p className="font-medium">No reports found</p>
        <p className="text-sm mt-1">Try changing your filters or area</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      <p className="text-sm font-semibold text-muted-foreground text-right">
        {sidebarReports.length} reports found
      </p>
      {sidebarReports.map((report) => {
        const statusConfig = getStatusConfig(report.status);
        const formattedDate = new Date(report.createdAt).toLocaleDateString(
          'en-En',
          { weekday: 'long', hour: '2-digit', minute: '2-digit' },
        );

        return (
          <div
            key={report.id}
            className="group relative w-full text-left rounded-lg border p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50 bg-white"
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
              <button
                type="button"
                onClick={() => !isGuestUser && handleShowDetails(report.id)}
                disabled={isGuestUser}
                className={cn(
                  'text-left w-full font-bold text-xl leading-tight mb-1 transition-colors outline-none focus-visible:underline',
                  isGuestUser
                    ? 'text-foreground/60 cursor-not-allowed'
                    : 'text-foreground group-hover:text-primary cursor-pointer',
                )}
                title={isGuestUser ? 'Login to view report details' : ''}
              >
                {report.title}
              </button>

              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-4 mb-2">
                <Tag className="size-3" />
                <span className="truncate max-w-[250px] text-sm font-medium">
                  {report.category.name}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3" />
                <span className="truncate max-w-[250px]">
                  {report.address || 'Address not available'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <CalendarDays className="size-3" />
                <span className="capitalize">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                {report.user ? (
                  <>
                    <User className="size-3" />
                    <span className="capitalize">
                      {report.user.firstName} {report.user.lastName}
                    </span>
                  </>
                ) : (
                  <>
                    <Ghost className="size-3 text-indigo-500" />
                    <span className="italic text-indigo-600/80 font-medium text-xs">
                      Anonymous Reporter
                    </span>
                  </>
                )}
              </div>
            </div>

            {report.status !== 'rejected' && (
              <div className="flex items-center justify-end pt-3 border-t border-dashed">
                <Button
                  variant="outline"
                  size="sm"
                  className="relative z-10 h-7 text-base rounded-md border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  onClick={(e) => handleReportClick(e, report)}
                >
                  Show on Map
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
