import { CitizenSidebar } from '@/components/layout/citizen-sidebar';
import { MunicipalSidebar } from '@/components/layout/municipal-sidebar';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

export function DashboardLayout() {
  const { isMunicipalityUser, isAdminUser, isCitizenUser, isGuestUser, isExternal } =
    useAuth();
  const [municipalSidebarOpen, setMunicipalSidebarOpen] = useState(true);
  const location = useLocation();
  const isMapPage = location.pathname === '/reports/map';
  const RIGHT_SIDEBAR_WIDTH = '400px';

  useEffect(() => {
    const isReportViewPage =
      location.pathname.includes('/app/assign-reports/') ||
      location.pathname.includes('/app/assigned-reports/');

    if (isReportViewPage && window.innerWidth >= 768) {
      setMunicipalSidebarOpen(false);
    }
  }, [location.pathname]);

  const showLeftSidebar = isMunicipalityUser || isAdminUser || isExternal;
  const showRightSidebar = (isCitizenUser || isGuestUser) && isMapPage;

  return (
    <div className="h-screen bg-background flex flex-col font-sans text-base antialiased overflow-hidden">
      <Navbar />
      <div className="flex flex-1 pt-16 relative h-[calc(100vh-4rem)]">
        {showLeftSidebar && (
          <MunicipalSidebar
            isOpen={municipalSidebarOpen}
            onToggle={() => setMunicipalSidebarOpen(!municipalSidebarOpen)}
          />
        )}
        <main
          className={cn(
            'flex-1 h-full relative transition-all duration-300 ease-out min-w-0',
            showLeftSidebar && (municipalSidebarOpen ? 'md:ml-72' : 'md:ml-20'),
            showRightSidebar && `md:mr-[${RIGHT_SIDEBAR_WIDTH}]`,
            showLeftSidebar ? 'pb-20 md:pb-0' : '',
          )}
        >
          <div
            className={cn(
              'w-full h-full overflow-auto',
              !isMapPage && 'p-6 md:p-8',
            )}
          >
            <Outlet />
          </div>
        </main>
        {showRightSidebar && <CitizenSidebar width={RIGHT_SIDEBAR_WIDTH} />}
      </div>
    </div>
  );
}
