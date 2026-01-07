import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import {
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotifications,
} from '@/hooks/use-notifications';
import { useProfile } from '@/hooks/use-profile';
import { Bell, ChevronsUpDown, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function Navbar() {
  const {
    user,
    logout,
    isMunicipalityUser,
    isMunicipalPrOfficer,
    isTechnicalOfficer,
    isExternal,
  } = useAuth();
  const { data: notifications } = useNotifications();
  const { data: unread } = useUnreadNotifications();
  const markRead = useMarkNotificationRead();
  const { data: profile } = useProfile({ enabled: !!user });
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/reports/map');
  };

  const getUserInitials = () => {
    if (!user) return '?';
    const firstName = profile?.user.firstName.charAt(0) || '?';
    const lastName = profile?.user.lastName.charAt(0) || '?';
    return (firstName + lastName).toUpperCase();
  };

  const getReportRoute = (reportId: string): string => {
    if (isMunicipalPrOfficer) {
      return `/app/assign-reports/view/${reportId}`;
    }
    if (isTechnicalOfficer) {
      return `/app/assigned-reports/view/${reportId}`;
    }
    if (isExternal) {
      return `/app/external/assigned-reports/${reportId}`;
    }
    return `/reports/view/${reportId}`;
  };

  const handleNotificationClick = (notificationId: string, reportId?: string) => {
    markRead.mutate(notificationId);
    if (reportId) {
      navigate(getReportRoute(reportId));
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-18 items-center justify-between border-b bg-background/95 px-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60">
      <Link
        to="/"
        className="flex items-center gap-3 font-bold hover:opacity-80 transition-opacity"
      >
        <div className="flex size-13 items-center justify-center rounded-xl bg-primary shadow-sm overflow-hidden">
          <img
            src="/logo.png"
            alt="Participium"
            className="size-full object-cover"
          />
        </div>
        <span className="text-xl tracking-tight text-foreground">
          Participium
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative">
                  <Bell className="size-5 text-muted-foreground" />
                  {unread && unread.length > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs w-5 h-5">
                      {unread.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2">
                <DropdownMenuLabel className="text-sm">
                  Notifications
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 10).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id, n.reportId)}
                      className={`flex flex-col items-start gap-1 cursor-pointer ${n.read ? 'opacity-60' : ''} ${n.reportId ? 'hover:bg-accent' : ''}`}
                    >
                      <div className="text-sm font-medium whitespace-normal break-all">
                        {n.message}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    No notifications
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-15 gap-3 px-3 hover:bg-muted rounded-xl cursor-pointer"
                >
                  <Avatar className="size-10 border-2 border-background shadow-sm">
                    <AvatarImage src={profile?.profilePictureUrl || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-col items-end text-right hidden md:flex max-w-[200px]">
                    {' '}
                    <span className="text-sm font-medium leading-none truncate">
                      {profile?.user.firstName} {profile?.user.lastName}
                    </span>
                  </div>

                  <ChevronsUpDown className="size-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuItem>
                  <div className="flex flex-col space-y-1 w-full min-w-0">
                    <p className="text-base font-medium truncate">
                      {profile?.user.firstName} {profile?.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile?.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize truncate">
                      {profile?.user.role?.label}
                    </p>
                  </div>
                </DropdownMenuItem>
                {!isMunicipalityUser && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-sm">
                      <Link
                        to="/profile"
                        className=" cursor-pointer hover:text-primary transition-colors"
                      >
                        Profile Settings
                      </Link>
                    </DropdownMenuLabel>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="h-10 text-base text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-3 size-5" color="#e53e3e" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Link to="/auth/login">
            <Button
              size="lg"
              className="text-base px-6 rounded-lg cursor-pointer"
            >
              Login
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
