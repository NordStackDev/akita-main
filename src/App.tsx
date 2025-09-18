import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AkitaApp } from "./pages/AkitaApp";
import { LoginPage } from "@/components/auth/LoginPage";
import { DevSetup } from "./pages/DevSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/dev" element={<DevSetup />} />
            {/* Legacy top-level routes redirect to /app/* */}
            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/sales" element={<Navigate to="/app/sales" replace />} />
            <Route path="/sales/new" element={<Navigate to="/app/sales/new" replace />} />
            <Route path="/locations" element={<Navigate to="/app/locations" replace />} />
            <Route path="/tracking" element={<Navigate to="/app/tracking" replace />} />
            <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
            <Route path="/stats" element={<Navigate to="/app/stats" replace />} />
            <Route path="/team" element={<Navigate to="/app/team" replace />} />

            <Route path="/app/auth" element={<LoginPage onLogin={() => {}} />} />
            <Route path="/app/*" element={<AkitaApp />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
