import { ReportsList } from '@/components/reports-list';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/auth-context';
import { useReports } from '@/hooks/use-reports';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/store/filterStore';
import { CitizenSidebarProps } from '@/types/ui';
import { GripHorizontal, Lock, Search } from 'lucide-react';
import { useState } from 'react';

function GuestState() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center space-y-6">
      <div className="size-20 rounded-full bg-slate-100 flex items-center justify-center mb-2 shadow-inner">
        <Lock className="size-10 text-slate-400" />
      </div>
      <div className="space-y-3 max-w-xs">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          Access Restricted
        </h3>
        <p className="text-base text-slate-500 leading-relaxed font-medium">
          Join our community to view active reports, track issues in your area,
          and contribute to a better city
        </p>
      </div>
    </div>
  );
}

export function CitizenSidebar({
  width = '400px',
}: Readonly<CitizenSidebarProps>) {
  const { isCitizenUser, isGuestUser } = useAuth();

  const { data: reports = [] } = useReports(undefined, {
    enabled: true,
    isGuest: isGuestUser,
  });

  const { searchTerm, setSearchTerm, showOnlyMyReports, setShowOnlyMyReports } =
    useFilterStore();

  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn(
          'fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity duration-300',
          isMobileExpanded
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setIsMobileExpanded(false)}
        aria-label="Close sidebar"
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

        <button
          type="button"
          className="flex w-full justify-center pt-3 pb-1 md:hidden cursor-pointer shrink-0 touch-none"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          aria-label={isMobileExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <GripHorizontal className="text-slate-300" />
        </button>

        {!isGuestUser && (
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
            </div>

            {isCitizenUser && (
              <div>
                <div className="flex items-center justify-between px-1">
                  <Label
                    htmlFor="my-reports"
                    className="text-sm font-medium cursor-pointer text-muted-foreground uppercase tracking-wider"
                  >
                    My reports
                  </Label>
                  <Switch
                    id="my-reports"
                    checked={showOnlyMyReports}
                    onCheckedChange={setShowOnlyMyReports}
                    className="scale-75 origin-right"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            'flex-1 overflow-y-auto bg-slate-50/50 p-0 transition-opacity duration-300 min-h-0',
            !isMobileExpanded &&
              'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto hidden md:block',
          )}
        >
          <ReportsList setIsMobileExpanded={setIsMobileExpanded} />

          <div className="h-24 md:h-20" />
        </div>
      </aside>
    </>
  );
}
