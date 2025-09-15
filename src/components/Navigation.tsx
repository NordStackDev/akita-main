import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home,
  ShoppingCart,
  MapPin,
  BarChart3,
  Users,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Target
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface NavigationProps {
  user: any;
  onLogout: () => void;
}

export const Navigation = ({ user, onLogout }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<{ level: number } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUserRole();
  }, [user]);

  const loadUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          role_id,
          user_roles!inner(level)
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user role:', error);
      } else {
        setUserRole({ level: data.user_roles.level });
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Nyt Salg", href: "/sales", icon: ShoppingCart },
    { name: "Lokationer", href: "/locations", icon: MapPin },
    { name: "Statistikker", href: "/stats", icon: BarChart3 },
    { name: "Team", href: "/team", icon: Users },
    // Show tracking only for teamlead and above (level <= 5)
    ...(userRole && userRole.level <= 5 ? [{ name: "Sælger Tracking", href: "/tracking", icon: Target }] : []),
  ];

  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Bruger';

  const handleNavigation = (href: string) => {
    navigate(href);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 akita-gradient rounded-lg flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="text-lg font-bold text-foreground">AKITA</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigation(item.href)}
                  className={`${
                    isActive 
                      ? "akita-gradient text-white" 
                      : "text-muted-foreground hover:text-foreground"
                  } akita-transition`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card border-border" align="end">
                <DropdownMenuLabel className="text-foreground">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={() => handleNavigation("/profile")}
                  className="text-foreground hover:bg-secondary cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleNavigation("/settings")}
                  className="text-foreground hover:bg-secondary cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Indstillinger</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-foreground hover:bg-secondary cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log ud</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      isActive 
                        ? "akita-gradient text-white" 
                        : "text-muted-foreground hover:text-foreground"
                    } akita-transition`}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};