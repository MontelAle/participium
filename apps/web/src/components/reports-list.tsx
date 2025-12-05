import type { Report } from '@repo/api';
import { CalendarDays, Ghost, MapPin, Tag, User } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useFilteredReports } from '@/hooks/use-filtered-reports';
import { cn, getStatusConfig } from '@/lib/utils';
import { useActiveReportStore } from '@/store/activeReportStore';
import type { ReportsListProps } from '@/types/report';

export function ReportsList({
  setIsMobileExpanded = () => {},
}: ReportsListProps) {
  const { reports: baseFilteredReports } = useFilteredReports();
  const { user, isCitizenUser, isGuestUser } = useAuth();
  const navigate = useNavigate();
  const setLocation = useActiveReportStore((state) => state.setLocation);

  const sidebarReports = useMemo(() => {
    if (isGuestUser) return [];
    if (!isCitizenUser || !user) return baseFilteredReports;

    return [...baseFilteredReports];
  }, [baseFilteredReports, isCitizenUser, isGuestUser, user]);

  const handleReportClick = (e: React.MouseEvent, report: Report) => {
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
            role="button"
            tabIndex={0}
            onClick={() => handleShowDetails(report.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleShowDetails(report.id);
              }
            }}
            className="group relative w-full text-left rounded-lg border p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50 bg-white cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
              <h3 className="font-bold text-xl leading-tight text-foreground mb-1 group-hover:text-primary transition-colors">
                {report.title}
              </h3>
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
                  className="h-7 text-base rounded-md border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 z-10"
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
