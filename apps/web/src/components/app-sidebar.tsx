import { ChevronRight, Home, Settings, Users, LogOut, ChevronsUpDown, Map } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportsList } from "@/components/reports-list";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { SidebarProps } from "@/types/ui";
import { toast } from "sonner";

export function AppSidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdminUser = user && user.role.name !== "user";
  const isRegularUser = user && user.role.name === "user";
  const isGuest = !user;

  const getUserInitials = () => {
    if (!user) return "?";
    const firstInitial = user.firstName?.charAt(0) || "";
    const lastInitial = user.lastName?.charAt(0) || "";
    return (firstInitial + lastInitial).toUpperCase() || user.username?.charAt(0).toUpperCase() || "U";
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully!");
  };

  const adminMenuItems = [
    { title: "Dashboard", href: "/", icon: Home },
    { title: "Users", href: "/users", icon: Users },
    { title: "Map", href: "/map", icon: Map },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b px-4">
          {isOpen && (
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                P
              </div>
              <span>Participium</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            className={cn(!isOpen && "mx-auto")}
          >
            <ChevronRight
              className={cn("size-4 transition-transform", isOpen && "rotate-180")}
            />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden p-2">
          {isAdminUser && isOpen && (
            <nav className="space-y-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          )}
          
          {(isGuest || isRegularUser) && isOpen && (
            <ReportsList
              canAddReport={isRegularUser}
              onAddReport={() => console.log("Add report")}
            />
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
                    "w-full justify-start gap-3",
                    !isOpen && "justify-center px-2"
                  )}
                >
                  <Avatar className="size-8">
                    <AvatarImage />
                    <AvatarFallback>
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {isOpen && (
                    <>
                      <div className="flex flex-1 flex-col items-start text-left text-sm">
                      <span className="font-medium">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
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
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role.name}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            isOpen && (
              <Link to="login">
                <Button className="w-full">Login / Register</Button>
              </Link>
            )
          )}
        </div>
      </div>
    </aside>
  );
}