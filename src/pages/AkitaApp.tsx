import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { Dashboard } from "@/components/Dashboard";
import { SalesPage } from "@/components/sales/SalesPage";
import { LocationsPage } from "@/components/locations/LocationsPage";

export const AkitaApp = () => {
  const { user, session, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 akita-gradient rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <p className="text-muted-foreground">Indlæser AKITA...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return (
      <Routes>
        <Route path="/auth" element={<LoginPage onLogin={() => {}} />} />
        <Route path="*" element={<Navigate to="/app/auth" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard user={user} onLogout={signOut} />} />
      <Route path="/sales" element={<SalesPage user={user} onLogout={signOut} />} />
      <Route path="/locations" element={<LocationsPage user={user} onLogout={signOut} />} />
      <Route path="/auth" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
};