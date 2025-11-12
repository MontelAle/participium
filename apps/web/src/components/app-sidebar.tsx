import {
  ChevronRight,
  Home,
  Settings,
  Users,
  LogOut,
  ChevronsUpDown,
  Map,
  Plus,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportsList } from '@/components/reports-list';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { SidebarProps } from '@/types/ui';
import { useActiveReportStore } from '@/store/activeReportStore';
import { useCreateReport } from '@/hooks/use-reports';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function AppSidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    logout,
    isAdminUser,
    isCitizenUser,
    isGuestUser,
    isMunicipalityUser,
  } = useAuth();

  const { locationData } = useActiveReportStore();
  const { mutateAsync: createReport } = useCreateReport();

  const getUserInitials = () => {
    if (!user) return '?';
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return (
      (firstInitial + lastInitial).toUpperCase() ||
      user.username?.charAt(0).toUpperCase() ||
      'U'
    );
  };

  const municipalMenuItems = [
    { title: 'Dashboard', href: '/app/dashboard', icon: Home },
  ];

  const adminMenuItems = [
    {
      title: 'Municipality Users',
      href: '/app/municipality-users',
      icon: Users,
    },
  ];

  const menuItems = municipalMenuItems;

  if (isAdminUser) {
    menuItems.push(...adminMenuItems);
  }

  const handleAddReport = async () => {
    if (!locationData) {
      toast.warning('Select a location on the map before creating a report.');
      return;
    }

    try {
      await createReport({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
      });

      toast.success('Report created successfully!');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create report';
      toast.error(message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300',
        isOpen ? 'w-72' : 'w-20',
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b px-4">
          {isOpen ? (
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Participium Logo"
                  className="size-full object-cover"
                />
              </div>
              <span>Participium</span>
            </Link>
          ) : (
            <></>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            className={cn(!isOpen && 'absolute right-2')}
          >
            <ChevronRight
              className={cn(
                'size-4 transition-transform',
                isOpen && 'rotate-180',
              )}
            />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden p-2">
          {isMunicipalityUser && (
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full gap-3',
                        isOpen ? 'justify-start' : 'justify-center px-0',
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      {isOpen && (
                        <span className="text-base">{item.title}</span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          )}

          {(isGuestUser || isCitizenUser) && (
            <>
              {isCitizenUser && (
                <Button
                  size="icon"
                  onClick={handleAddReport}
                  className={cn(
                    'mb-3',
                    isOpen ? 'w-full' : 'w-12 h-12 mx-auto',
                  )}
                >
                  <Plus className="size-5" />
                  {isOpen && <span className="ml-2">Add Report</span>}
                </Button>
              )}
              {isOpen && <ReportsList />}
            </>
          )}
        </div>

        <Separator />
        <div className="p-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full gap-3',
                    isOpen ? 'justify-start' : 'justify-center px-2',
                  )}
                >
                  <Avatar className="size-9">
                    <AvatarImage />
                    <AvatarFallback className="text-base">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {isOpen && (
                    <>
                      <div className="flex flex-1 flex-col items-start text-left">
                        <span className="font-medium text-base">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-sm text-muted-foreground capitalize">
                          {user.role.name}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.role.name}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            isOpen && (
              <Link to="/auth/login">
                <Button className="w-full">Login / Register</Button>
              </Link>
            )
          )}
        </div>
      </div>
    </aside>
  );
}
