import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  MapPin,
  BarChart3,
  Users,
  Settings,
  LogOut,
  User,
  Target,
  Crown,
  Building,
  UserPlus,
  Briefcase,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppSidebarProps {
  user: any;
  onLogout: () => void;
}

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [userRole, setUserRole] = useState<{
    level: number;
    name?: string;
  } | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load user role
      const { data: roleData } = await supabase
        .from("users")
        .select(
          `
          role_id,
          user_roles!inner(level, name)
        `
        )
        .eq("id", user.id)
        .single();

      if (roleData) {
        setUserRole({
          level: roleData.user_roles.level,
          name: roleData.user_roles.name,
        });
      }

      // Load profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_image_url")
        .eq("user_id", user.id)
        .single();

      setProfileData(profile);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const navigationItems =
    userRole && userRole.level >= 6 && userRole.name !== "developer"
      ? [{ title: "Forside", url: "/app/dashboard", icon: Home }]
      : [
          { title: "Dashboard", url: "/app/dashboard", icon: Home },
          { title: "Nyt Salg", url: "/app/sales", icon: ShoppingCart },
          { title: "Lokationer", url: "/app/locations", icon: MapPin },
          { title: "Statistikker", url: "/app/stats", icon: BarChart3 },
          { title: "Team", url: "/app/team", icon: Users },
          // Show tracking for teamlead and above (level <= 5) or developer
          ...(userRole && (userRole.level <= 5 || userRole.name === "developer")
            ? [{ title: "Sælger Tracking", url: "/app/tracking", icon: Target }]
            : []),
        ];

  // CEO specific navigation items
  const ceoItems =
    userRole && (userRole.name === "ceo" || userRole.name === "CEO")
      ? [
          { title: "Team Management", url: "/app/ceo/team", icon: Users },
          {
            title: "Organisationer",
            url: "/app/ceo/organizations",
            icon: Building,
          },
          { title: "Inviter Sælger", url: "/app/ceo/invite", icon: UserPlus },
          { title: "Virksomhed", url: "/app/ceo/company", icon: Briefcase },
        ]
      : [];

  // Admin specific navigation items
  const adminItems =
    userRole && (userRole.level <= 2 || userRole.name === "developer")
      ? [
          {
            title: "Organisation Administration",
            url: "/app/admin/organizations",
            icon: Building,
          },
          // Add more admin links here as needed
        ]
      : [];

  const isActive = (path: string) => currentPath === path;
  const isExpanded = navigationItems.some((item) => isActive(item.url));
  const isCeoExpanded = ceoItems.some((item) => isActive(item.url));

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-accent text-accent-foreground font-medium"
      : "hover:bg-accent/50";

  const userName =
    user?.user_metadata?.first_name || user?.email?.split("@")[0] || "Bruger";
  const userInitials = userName.charAt(0).toUpperCase();

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"}>
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="w-8 h-8 akita-gradient rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          {state !== "collapsed" && (
            <span className="text-lg font-bold text-foreground">AKITA</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        getNavClassName({ isActive })
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* CEO Section */}
        {ceoItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              {state !== "collapsed" && "CEO"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ceoItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          getNavClassName({ isActive })
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              {state !== "collapsed" && "Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          getNavClassName({ isActive })
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profileData?.profile_image_url || undefined}
                    />
                    <AvatarFallback className="text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {state !== "collapsed" && (
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-sm font-medium truncate">
                        {userName}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </span>
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-card border-border"
              align="end"
              side="top"
            >
              <DropdownMenuLabel className="text-foreground">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild>
                <NavLink to="/app/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Indstillinger</span>
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-foreground hover:bg-secondary cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log ud</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
