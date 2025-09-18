import { ChangelogNavDialog } from "@/components/ChangelogNavDialog";
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
  Code,
  Shield,
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
  const [userRole, setUserRole] = useState<{ level: number; name?: string } | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // Standard navigation items
  const navigationItems =
    userRole && userRole.level >= 6 && userRole.name !== "developer"
      ? [{ title: "Forside", url: "/app/dashboard", icon: Home }]
      : [
          { title: "Dashboard", url: "/app/dashboard", icon: Home },
          ...(userRole && userRole.name === "developer"
            ? [
                { title: "Nyt Salg", url: "/app/sales", icon: ShoppingCart },
                { title: "Lokationer", url: "/app/locations", icon: MapPin },
                { title: "Statistikker", url: "/app/stats", icon: BarChart3 },
                { title: "Team", url: "/app/team", icon: Users },
                { title: "Sælger Tracking", url: "/app/tracking", icon: Target },
              ]
            : [
                { title: "Nyt Salg", url: "/app/sales", icon: ShoppingCart },
                { title: "Lokationer", url: "/app/locations", icon: MapPin },
                { title: "Statistikker", url: "/app/stats", icon: BarChart3 },
                { title: "Team", url: "/app/team", icon: Users },
                ...(userRole && userRole.level <= 5
                  ? [{ title: "Sælger Tracking", url: "/app/tracking", icon: Target }]
                  : []),
              ]),
        ];

  // CEO navigation
  const ceoItems =
    userRole && userRole.name?.toLowerCase() === "ceo"
      ? [
          { title: "Organisationer", url: "/app/ceo/organizations", icon: Building },
          { title: "Team", url: "/app/ceo/team", icon: Users },
          { title: "Inviter Sælger", url: "/app/ceo/invite", icon: UserPlus },
          { title: "Virksomhed", url: "/app/ceo/company", icon: Briefcase },
        ]
      : [];

  // Admin navigation
  const adminItems =
    userRole &&
    (userRole.level <= 2 || userRole.name === "developer") &&
    userRole.name?.toLowerCase() !== "ceo"
      ? [
          { title: "Organisation Administration", url: "/app/admin/organizations", icon: Building },
          { title: "Inviter bruger/CEO", url: "/app/admin/invite", icon: UserPlus },
        ]
      : [];

  // Developer navigation
  const developerItems =
    userRole && userRole.name === "developer"
      ? [
          { title: "System Overvågning", url: "/app/developer/monitoring", icon: Shield },
          { title: "Changelog Admin", url: "/app/developer/changelog", icon: BarChart3 },
          { title: "CEO Team Management", url: "/app/ceo/team", icon: Users },
          { title: "CEO Organisationer", url: "/app/ceo/organizations", icon: Building },
          { title: "CEO Inviter Sælger", url: "/app/ceo/invite", icon: UserPlus },
          { title: "CEO Virksomhed", url: "/app/ceo/company", icon: Briefcase },
        ]
      : [];

  const isActive = (path: string) => currentPath === path;

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50";

  const userName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "Bruger";
  const userInitials = userName.charAt(0).toUpperCase();
  const userRoleLabel =
    userRole?.name ? userRole.name.charAt(0).toUpperCase() + userRole.name.slice(1) : "";

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="h-8 w-8 bg-accent rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          {state !== "collapsed" && <span className="text-lg font-bold text-foreground">AKITA</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
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
                      <NavLink to={item.url} end className={({ isActive }) => getNavClassName({ isActive })}>
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
                      <NavLink to={item.url} end className={({ isActive }) => getNavClassName({ isActive })}>
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

        {/* Developer Section */}
        {developerItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Code className="w-4 h-4 text-green-500" />
              {state !== "collapsed" && "Developer Access"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {developerItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={({ isActive }) => getNavClassName({ isActive })}>
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
      <ChangelogNavDialog />
      <SidebarFooter className="border-t border-border">
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profileData?.profile_image_url || undefined} />
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  {state !== "collapsed" && (
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-sm font-medium truncate">{userName}</span>
                      <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                      {userRoleLabel && (
                        <span className="text-xs text-accent-foreground/80 italic truncate mt-1 opacity-80 w-full text-left block">
                          {userRoleLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-border" align="end" side="top">
              <DropdownMenuLabel className="text-foreground">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  {userRoleLabel && (
                    <p className="text-xs text-accent-foreground/80 italic leading-none mt-1 opacity-80">
                      Rolle: {userRoleLabel}
                    </p>
                  )}
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
              <DropdownMenuItem onClick={onLogout} className="text-foreground hover:bg-secondary cursor-pointer">
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