import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { Dashboard } from "@/components/Dashboard";
import { SalesPage } from "@/components/sales/SalesPage";
import { LocationsPage } from "@/components/locations/LocationsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { TrackingPage } from "@/components/tracking/TrackingPage";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { StatsPage } from "@/components/stats/StatsPage";
import { TeamPage } from "@/components/team/TeamPage";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { AppLayout } from "@/components/AppLayout";

import { CEOTeamManagement } from "@/components/ceo/CEOTeamManagement";
import { CEOOrganizations } from "@/components/ceo/CEOOrganizations";
import { CEOInviteSalesperson } from "@/components/ceo/CEOInviteSalesperson";
import { CEOCompany } from "@/components/ceo/CEOCompany";
import { CEODashboard } from "@/components/ceo/CEODashboard";

import { ChangelogAdminPage } from "@/components/developer/ChangelogAdminPage";
import { SystemMonitoringPage } from "@/components/developer/SystemMonitoringPage";

import { OrganizationManagementPage } from "@/components/admin/OrganizationManagementPage";
import AllUsersPage from "./AllUsersPage";
import UserAdminPage from "./UserAdminPage";
import InvitePage from "./InvitePage";

interface UserRole { level: number; name?: string }

export const AkitaApp = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [ceoOnboardingRequired, setCeoOnboardingRequired] = useState(false);

  useEffect(() => {
    if (user) loadUserRole();
    else setRoleLoading(false);
  }, [user]);

  // Load user role when user is available and authenticated
  const loadUserRole = async () => {
    if (!user?.id) {
      setRoleLoading(false);
      return;
    }
    
    try {
      // Ensure invited users are properly linked
      try { 
        await supabase.rpc("attach_auth_user_to_invited_user"); 
      } catch (e) {
        console.log("RPC call handled:", e);
      }

      const { data, error } = await supabase
        .from("users")
        .select("first_login_completed, force_password_reset, role_id, organization_id, user_roles!inner(level,name)")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading user data:", error);
        if (error.code === "PGRST116") {
          // User not found in database - probably needs onboarding
          setOnboardingRequired(true);
          setRoleLoading(false);
          return;
        }
        throw error;
      }

      if (!data) {
        console.log("No user data found, redirecting to auth");
        await signOut();
        navigate("/app/auth", { replace: true });
        return;
      }

      setUserRole({ level: data.user_roles.level, name: data.user_roles.name });
      setOnboardingRequired(!data.first_login_completed);
      setCeoOnboardingRequired(
        data.user_roles.name === "ceo" && 
        (!data.organization_id || !data.first_login_completed)
      );
    } catch (error: any) {
      console.error("Error in loadUserRole:", error);
      if (error?.code === "403" || error?.code === "401") {
        await signOut();
        navigate("/app/auth", { replace: true });
      }
    } finally {
      setRoleLoading(false);
    }
  };

  if (roleLoading) return <LoadingSkeleton />;

  if (!user) return <Navigate to="/app/auth" replace />;

  if (ceoOnboardingRequired || onboardingRequired) {
  let role: "ceo" | "admin" | "sales" = "sales";
  if (userRole?.name?.toLowerCase() === "ceo") role = "ceo";
  else if (userRole?.name?.toLowerCase() === "admin") role = "admin";

  // Optimize: Use useCallback for onboarding completion
  const handleOnboardingComplete = useCallback(() => {
    setCeoOnboardingRequired(false);
    setOnboardingRequired(false);
    loadUserRole();
  }, []);

    return <OnboardingFlow role={role} onComplete={handleOnboardingComplete} />;
  }


  if (userRole?.name?.toLowerCase() === "ceo") {
    return (
      <AppLayout user={user} onLogout={signOut}>
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="ceo" element={<CEODashboard />} />
          <Route path="ceo/team" element={<CEOTeamManagement />} />
          <Route path="ceo/organizations" element={<CEOOrganizations />} />
          <Route path="ceo/invite" element={<CEOInviteSalesperson />} />
          <Route path="ceo/company" element={<CEOCompany />} />
          <Route path="ceo/tracking" element={<TrackingPage />} />
          <Route path="ceo/stats" element={<StatsPage />} />
          <Route path="ceo/locations" element={<LocationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="auth" element={<Navigate to="/app/ceo" replace />} />
          <Route path="/" element={<Navigate to="/app/ceo" replace />} />
          <Route path="*" element={<Navigate to="/app/ceo" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  if (userRole?.name === "developer") {
    return (
      <AppLayout user={user} onLogout={signOut}>
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="tracking" element={<TrackingPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="developer/monitoring" element={<SystemMonitoringPage />} />
          <Route path="developer/changelog" element={<ChangelogAdminPage />} />
          <Route path="ceo/team" element={<CEOTeamManagement />} />
          <Route path="ceo/organizations" element={<CEOOrganizations />} />
          <Route path="ceo/invite" element={<CEOInviteSalesperson />} />
          <Route path="ceo/company" element={<CEOCompany />} />
          <Route path="admin/organizations" element={<OrganizationManagementPage />} />
          <Route path="admin/invite" element={<InvitePage />} />
          <Route path="all-users" element={<AllUsersPage />} />
          <Route path="auth" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  if (userRole?.name?.toLowerCase() === "admin") {
    return (
      <AppLayout user={user} onLogout={signOut}>
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="tracking" element={<TrackingPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin/organizations" element={<OrganizationManagementPage />} />
          <Route path="admin/invite" element={<InvitePage />} />
          <Route path="all-users" element={<AllUsersPage />} />
          <Route path="auth" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  // Sælger: forsimpelt view – kun én side, men let at bygge videre på
  return (
    <AppLayout user={user} onLogout={signOut}>
      <main className="container mx-auto px-4 py-6">
        {/* Her kan du bygge flere komponenter på sælgersiden */}
        <SalesPage />
      </main>
    </AppLayout>
  );
};
