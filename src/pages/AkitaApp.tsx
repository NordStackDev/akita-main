import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { Dashboard } from "@/components/Dashboard";
import { SalesPage } from "@/components/sales/SalesPage";
import { LocationsPage } from "@/components/locations/LocationsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { TrackingPage } from "@/components/tracking/TrackingPage";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { StatsPage } from "@/components/stats/StatsPage";
import { TeamPage } from "@/components/team/TeamPage";
import { AppLayout } from "@/components/AppLayout";

import { CEOTeamManagement } from "@/components/ceo/CEOTeamManagement";
import { CEOOrganizations } from "@/components/ceo/CEOOrganizations";
import { CEOInviteSalesperson } from "@/components/ceo/CEOInviteSalesperson";
import { CEOCompany } from "@/components/ceo/CEOCompany";
import { CEODashboard } from "@/components/ceo/CEODashboard";

import { ChangelogAdminPage } from "@/components/developer/ChangelogAdminPage";
import { SystemMonitoringPage } from "@/components/developer/SystemMonitoringPage";

import { OrganizationManagementPage } from "@/components/admin/OrganizationManagementPage";
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

  const loadUserRole = async () => {
    try {
      try { await supabase.rpc("attach_auth_user_to_invited_user"); } catch {}

      const { data, error } = await supabase
        .from("users")
        .select("first_login_completed, force_password_reset, role_id, organization_id, user_roles!inner(level,name)")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) {
        // Hvis Supabase returnerer 403 (session invalid/brugeren slettet), log ud og redirect
        if (error.code === "403") {
          await signOut();
          navigate("/app/auth", { replace: true });
          return;
        }
        console.error("Error loading user role:", error);
      }

      if (!data) {
        await signOut();
        navigate("/app/auth", { replace: true });
        return;
      }

      setUserRole({ level: data.user_roles.level, name: data.user_roles.name });
      setOnboardingRequired(!data.first_login_completed);
      if (data.user_roles.name === "ceo" && (!data.organization_id || !data.first_login_completed)) {
        setCeoOnboardingRequired(true);
      }
    } catch (error: any) {
      // Fallback: Hvis Supabase fejler med 403, log ud og redirect
      if (error?.code === "403") {
        await signOut();
        navigate("/app/auth", { replace: true });
        return;
      }
      console.error("Error loading user role:", error);
    } finally {
      setRoleLoading(false);
    }
  };

  if (roleLoading) return null;

  if (!user) return <Navigate to="/app/auth" replace />;

  if (ceoOnboardingRequired || onboardingRequired) {
  let role: "ceo" | "admin" | "sales" = "sales";
  if (userRole?.name?.toLowerCase() === "ceo") role = "ceo";
  else if (userRole?.name?.toLowerCase() === "admin") role = "admin";

    // Kun reload userRole når hele onboarding-stepperen er færdig (onComplete)
    const handleOnboardingComplete = () => {
      setCeoOnboardingRequired(false);
      setOnboardingRequired(false);
      // Reload userRole after onboarding completion
      loadUserRole();
    };

    return <OnboardingFlow role={role} onComplete={handleOnboardingComplete} />;
  }


  if (userRole?.name?.toLowerCase() === "ceo") {
    return (
      <AppLayout user={user} onLogout={signOut}>
        <Routes>
          <Route path="ceo" element={<CEODashboard />} />
          <Route path="ceo/team" element={<CEOTeamManagement />} />
          <Route path="ceo/organizations" element={<CEOOrganizations />} />
          <Route path="ceo/invite" element={<CEOInviteSalesperson />} />
          <Route path="ceo/company" element={<CEOCompany />} />
          <Route path="ceo/settings" element={<SettingsPage />} />
          {/* Tilføj navigation-sider til CEO */}
          <Route path="ceo/tracking" element={<TrackingPage />} />
          <Route path="ceo/stats" element={<StatsPage />} />
          <Route path="ceo/locations" element={<LocationsPage />} />
          {/* Fallbacks for CEO */}
          <Route path="dashboard" element={<Navigate to="/app/ceo" replace />} />
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/new" element={<SalesPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/developer/monitoring" element={<SystemMonitoringPage />} />
          <Route path="/developer/changelog" element={<ChangelogAdminPage />} />
          <Route path="/ceo/team" element={<CEOTeamManagement />} />
          <Route path="/ceo/organizations" element={<CEOOrganizations />} />
          <Route path="/ceo/invite" element={<CEOInviteSalesperson />} />
          <Route path="/ceo/company" element={<CEOCompany />} />
          <Route path="/admin/organizations" element={<OrganizationManagementPage />} />
          <Route path="/admin/invite" element={<InvitePage />} />
          <Route path="/auth" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  return <Navigate to="/app/dashboard" replace />;
};
