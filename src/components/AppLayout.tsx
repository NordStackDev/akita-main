import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
  user: any;
  onLogout: () => void;
}

export function AppLayout({ children, user, onLogout }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar user={user} onLogout={onLogout} />
        
        <div className="flex-1 flex flex-col">
          {/* Header with trigger */}
          <header className="h-12 flex items-center border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4">
            <SidebarTrigger />
          </header>
          
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}