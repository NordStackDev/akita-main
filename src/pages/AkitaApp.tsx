import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { Dashboard } from "@/components/Dashboard";
import { SalesApp } from "@/components/sales/SalesApp";
import { SalesPage } from "@/components/sales/SalesPage";
import { LocationsPage } from "@/components/locations/LocationsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { TrackingPage } from "@/components/tracking/TrackingPage";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AkitaApp = () => {
  const { user, session, loading, signOut } = useAuth();
  const [userRole, setUserRole] = useState<{ level: number } | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserRole();
    } else {
      setRoleLoading(false);
    }
  }, [user]);

  const loadUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          role_id,
          user_roles!inner(level)
        `)
        .eq('id', user!.id)
        .single();

      if (error) {
        console.error('Error loading user role:', error);
      } else {
        setUserRole({ level: data.user_roles.level });
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    } finally {
      setRoleLoading(false);
    }
  };

  if (loading || roleLoading) {
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

  // Show sales interface for sellers (levels 6-8) 
  if (userRole && userRole.level >= 6) {
    return (
      <Routes>
        <Route path="/sales" element={<SalesApp user={user} onLogout={signOut} />} />
        <Route path="/settings" element={<SettingsPage user={user} onLogout={signOut} />} />
        <Route path="/" element={<Navigate to="/app/sales" replace />} />
        <Route path="*" element={<Navigate to="/app/sales" replace />} />
      </Routes>
    );
  }

  // Show admin dashboard for higher levels (0-5: developer, admin, CEO, direktør, chef, leder)
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard user={user} onLogout={signOut} />} />
      <Route path="/sales" element={<SalesPage user={user} onLogout={signOut} />} />
      <Route path="/locations" element={<LocationsPage user={user} onLogout={signOut} />} />
      <Route path="/tracking" element={<TrackingPage user={user} onLogout={signOut} />} />
      <Route path="/settings" element={<SettingsPage user={user} onLogout={signOut} />} />
      <Route path="/auth" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
};