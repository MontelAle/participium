import { useState, useMemo } from 'react';
import { Plus, Search, MapPin, X, GripHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ReportsList } from '@/components/reports-list';
import { FilterDialog } from './filter-dialog';
import { useActiveReportStore } from '@/store/activeReportStore';
import { useFilterStore } from '@/store/filterStore';
import { useReports } from '@/hooks/use-reports';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CitizenSidebarProps } from '@/types/ui';

export function CitizenSidebar({ width = '400px' }: CitizenSidebarProps) {
  const navigate = useNavigate();
  const { isCitizenUser } = useAuth();
  const { locationData, clearLocation } = useActiveReportStore();
  const { data: reports = [] } = useReports();

  const { searchTerm, setSearchTerm, filters, setFilters } = useFilterStore();

  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(reports.map((r) => r.category.name));
    return Array.from(cats);
  }, [reports]);

  const handleAddReport = () => {
    if (!locationData) {
      toast.warning(
        'Please select a location on the map before adding a report.',
      );
      return;
    }
    navigate('/new-report', { state: { ...locationData } });
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity duration-300',
          isMobileExpanded
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setIsMobileExpanded(false)}
      />

      <aside
        className={cn(
          'fixed z-40 bg-slate-50 flex flex-col shadow-2xl transition-all duration-300 ease-in-out border-l border-slate-200',
          'bottom-0 left-0 right-0 w-full rounded-t-2xl md:rounded-none',
          isMobileExpanded ? 'h-[85vh]' : 'h-auto max-h-[40vh]',
          'md:top-16 md:right-0 md:bottom-0 md:left-auto',
          'md:h-auto md:max-h-none',
        )}
        style={{
          ['--desktop-width' as string]: width,
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            aside { width: var(--desktop-width) !important; }
          }
        `}</style>

        <div
          className="flex w-full justify-center pt-3 pb-1 md:hidden cursor-pointer shrink-0 touch-none"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        >
          <GripHorizontal className="text-slate-300" />
        </div>

        <div className="px-4 pb-4 pt-2 md:pt-4 bg-slate-50 border-b space-y-3 shrink-0 z-10">
          <div className="flex w-full items-center rounded-md border bg-background shadow-sm focus-within:ring-1 focus-within:ring-primary">
            <div className="flex h-9 items-center px-3 text-muted-foreground">
              <Search className="size-4" />
            </div>
            <Input
              placeholder="Search report..."
              className="h-12 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-base flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsMobileExpanded(true)}
            />
            <FilterDialog
              filters={filters}
              setFilters={setFilters}
              categories={categories}
            />
          </div>

          {isCitizenUser && (
            <div className="flex items-center justify-between px-1">
              <Label
                htmlFor="my-reports"
                className="text-sm font-medium cursor-pointer text-muted-foreground uppercase tracking-wider"
              >
                My reports
              </Label>
              <Switch
                id="my-reports"
                checked={showMyReports}
                onCheckedChange={setShowMyReports}
                className="scale-75 origin-right"
              />
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex-1 overflow-y-auto bg-slate-50/50 p-0 transition-opacity duration-300 min-h-0',
            !isMobileExpanded &&
              'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto hidden md:block',
          )}
        >
          <ReportsList onlyMyReports={showMyReports} />
          <div className="h-24 md:h-20" />
        </div>
      </aside>
    </>
  );
}
