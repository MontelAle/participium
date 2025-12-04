import { useReports } from '@/hooks/use-reports';
import { useActiveReportStore } from '@/store/activeReportStore';
import { useFilterStore } from '@/store/filterStore';
import { useAuth } from '@/contexts/auth-context';
import type { Report } from '@repo/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFilteredReports } from '@/hooks/use-filtered-reports';
import { getStatusConfig } from '@/lib/utils';
import { MapPin, CalendarDays, Tag, User, Ghost } from 'lucide-react';
import { ReportsListProps } from '@/types/report';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

export function ReportsList({
  setIsMobileExpanded = () => {},
}: ReportsListProps) {
  const { reports: baseFilteredReports } = useFilteredReports();
  const { data: allReports = [] } = useReports({ enabled: true });
  const { user, isCitizenUser, isGuestUser } = useAuth();
  const { searchTerm, filters, showOnlyMyReports } = useFilterStore();
  const navigate = useNavigate();
  const setLocation = useActiveReportStore((state) => state.setLocation);

  const sidebarReports = useMemo(() => {
    if (isGuestUser) return [];
    if (!isCitizenUser || !user) return baseFilteredReports;

    const myRejectedReports = allReports.filter((report) => {
      ////
      if (report.status !== 'rejected') return false;
      if (report.userId !== user.id) return false;

      if (!report.userId) return false;

      if (showOnlyMyReports && report.userId !== user.id) return false;
      ////
      
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matches =
          report.title.toLowerCase().includes(term) ||
          (report.address && report.address.toLowerCase().includes(term)) ||
          report.category.name.toLowerCase().includes(term);
        if (!matches) return false;
      }

      if (filters?.status && report.status !== filters.status) return false;
      if (filters?.category && report.category.name !== filters.category)
        return false;

      return true;
    });

    return [...baseFilteredReports, ...myRejectedReports];
  }, [
    baseFilteredReports,
    allReports,
    isCitizenUser,
    isGuestUser,
    user,
    searchTerm,
    filters,
    showOnlyMyReports,
  ]);

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
            onClick={() => handleShowDetails(report.id)}
            className="group relative w-full rounded-lg border p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50 bg-white cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
