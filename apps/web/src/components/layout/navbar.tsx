import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ChevronsUpDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/use-profile';

export function Navbar() {
  const { user, logout, isMunicipalityUser } = useAuth();
  const { data: profile } = useProfile({ enabled: !!user });
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/reports/map');
  };
  //console.log(profile?.user.role.label);

  const getUserInitials = () => {
    if (!user) return '?';
    const firstName =  profile?.user.firstName.charAt(0) || '?';
    const lastName =  profile?.user.lastName.charAt(0) || '?';
    /*
    return (
      (user.firstName?.charAt(0) + user.lastName?.charAt(0)).toUpperCase() ||
      '?'
    );
    */
   return(
    (firstName + lastName).toUpperCase()
   );

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
                    {/*{user.firstName} {user.lastName}*/} {profile?.user.firstName} {profile?.user.lastName}
                  </span>
                </div>

                <ChevronsUpDown className="size-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <DropdownMenuItem>
                <div className="flex flex-col space-y-1 w-full min-w-0">
                  <p className="text-base font-medium truncate">
                    {/*{user.firstName} {user.lastName}*/} {profile?.user.firstName} {profile?.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {/*{user.email}*/} {profile?.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize truncate">
                    {/*{user.role.label}*/}  {profile?.user.role?.label}
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
