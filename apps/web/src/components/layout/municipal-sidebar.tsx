import { Home, Users, ChevronRight, ChevronLeft ,FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { MunicipalSidebarProps } from '@/types/ui';

export function MunicipalSidebar({ isOpen, onToggle }: MunicipalSidebarProps) {
  const location = useLocation();
  const { isAdminUser , isMunicipalPrOfficer , isTechnicalOfficer } = useAuth();

  const menuItems = [
    { title: 'Dashboard', href: '/app/dashboard', icon: Home },
  ];

  if (isAdminUser) {
    menuItems.push({
      title: 'Municipality Users',
      href: '/app/municipality-users',
      icon: Users,
    });
  }

  if (isMunicipalPrOfficer) {
    menuItems.push({
      title: 'View Reports',
      href: '/app/municipality-pr-officer',
      icon: FileText,
    });
  }

  if (isTechnicalOfficer) {
    menuItems.push({
      title: 'View Reports',
      href: '/app/technical-officer',
      icon: FileText,
    });
  }
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t bg-background px-2 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.05)] md:hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link key={item.href} to={item.href} className="flex-1 max-w-80px">
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl transition-all duration-300',
                  isActive
                    ? 'text-primary bg-primary/10 translate-y-[-5px]'
                    : 'text-muted-foreground hover:bg-muted/50',
                )}
              >
                <Icon
                  className={cn(
                    'size-6 transition-transform',
                    isActive && 'scale-110 stroke-[2.5px]',
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] leading-none transition-all',
                    isActive
                      ? 'font-bold opacity-100'
                      : 'font-medium opacity-80',
                  )}
                >
                  {item.title.split(' ')[0]}{' '}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
      <aside
        className={cn(
          'hidden md:flex fixed z-40 flex-col bg-card text-card-foreground shadow-xl transition-all duration-300 ease-out overflow-hidden border',
          'md:left-4 md:top-24 md:h-[calc(100vh-7rem)]',
          'md:rounded-xl',
          isOpen ? 'md:w-72' : 'md:w-20',
        )}
      >
        <div className="flex h-full flex-col py-6 px-3">
          <nav className="flex-1 space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link key={item.href} to={item.href} className="block group">
                  <div
                    className={cn(
                      'relative flex items-center h-12 mb-1 transition-all duration-200 ease-in-out rounded-lg cursor-pointer overflow-hidden',
                      isOpen ? 'px-4' : 'justify-center px-0',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                    title={!isOpen ? item.title : undefined}
                  >
                    <Icon
                      className={cn(
                        'size-5 shrink-0 transition-colors',
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    />

                    <span
                      className={cn(
                        'ml-3 text-base font-medium truncate transition-all duration-300',
                        isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden',
                        isActive && 'font-semibold',
                      )}
                    >
                      {item.title}
                    </span>

                    {isActive && isOpen && (
                      <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-background/30" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="w-full h-10 rounded-lg hover:bg-muted text-muted-foreground"
            >
              {isOpen ? (
                <ChevronLeft className="size-5" />
              ) : (
                <ChevronRight className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
