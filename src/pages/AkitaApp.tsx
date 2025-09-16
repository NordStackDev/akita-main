import { ChangelogPopup } from "@/components/ChangelogPopup";
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
import { OnboardingPage } from "@/components/auth/OnboardingPage";
import { StatsPage } from "@/components/stats/StatsPage";
import { TeamPage } from "@/components/team/TeamPage";
import { AppLayout } from "@/components/AppLayout";
import { CEOOnboardingForm } from "@/components/ceo/CEOOnboardingForm";
import { CEOTeamManagement } from "@/components/ceo/CEOTeamManagement";
import { CEOOrganizations } from "@/components/ceo/CEOOrganizations";
import { CEOInviteSalesperson } from "@/components/ceo/CEOInviteSalesperson";
import { CEOCompany } from "@/components/ceo/CEOCompany";
import { OrganizationManagementPage } from "@/components/admin/OrganizationManagementPage";
import InvitePage from "./InvitePage";

interface UserRole {
  level: number;
  name?: string;
}

export const AkitaApp = () => {
  // Changelog-popup vises globalt
  const { user, session, loading, signOut } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [ceoOnboardingRequired, setCeoOnboardingRequired] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserRole();
    } else {
      setRoleLoading(false);
    }
  }, [user]);

  const loadUserRole = async () => {
    try {
      try {
        await supabase.rpc("attach_auth_user_to_invited_user");
      } catch (e) {
        // ignore
      }

      const { data, error } = await supabase
        .from("users")
        .select(
          `
          first_login_completed,
          force_password_reset,
          role_id,
          organization_id,
          user_roles!inner(level, name)
        `
        )
        .eq("id", user!.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading user role:", error);
      }

      if (data) {
        setUserRole({
          level: data.user_roles.level,
          name: data.user_roles.name,
        });

        if (
          data.user_roles.name === "ceo" &&
          (!data.organization_id || !data.first_login_completed)
        ) {
          setCeoOnboardingRequired(true);
        } else {
          setOnboardingRequired(
            Boolean(data.force_password_reset) ||
              !Boolean(data.first_login_completed)
          );
        }
      } else {
        setOnboardingRequired(true);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
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
        <Route path="*" element={<LoginPage onLogin={() => {}} />} />
      </Routes>
    );
  }

  if (ceoOnboardingRequired) {
    const handleCeoOnboardingComplete = () => {
      setCeoOnboardingRequired(false);
      loadUserRole();
    };
    return <CEOOnboardingForm onComplete={handleCeoOnboardingComplete} />;
  }

  if (onboardingRequired) {
    const handleOnboardingComplete = () => {
      setOnboardingRequired(false);
      loadUserRole();
    };
    return (
      <Routes>
        <Route
          path="/onboarding"
          element={<OnboardingPage onComplete={handleOnboardingComplete} />}
        />
        <Route path="*" element={<Navigate to="/app/onboarding" replace />} />
      </Routes>
    );
  }

  // Developer gets access to everything
  if (userRole && userRole.name === "developer") {
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
          {/* CEO Routes */}
          <Route path="/ceo/team" element={<CEOTeamManagement />} />
          <Route path="/ceo/organizations" element={<CEOOrganizations />} />
          <Route path="/ceo/invite" element={<CEOInviteSalesperson />} />
          <Route path="/ceo/company" element={<CEOCompany />} />
          {/* Admin Routes */}
          <Route
            path="/admin/organizations"
            element={<OrganizationManagementPage />}
          />
          <Route path="/admin/invite" element={<InvitePage />} />
          <Route
            path="/auth"
            element={<Navigate to="/app/dashboard" replace />}
          />
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  // Show sales interface for sellers (levels 6-8)
  if (userRole && userRole.level >= 6) {
    return (
      <AppLayout user={user} onLogout={signOut}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<SalesApp />} />
          <Route path="/sales/new" element={<SalesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  // Show admin dashboard for higher levels (0-5: admin, ceo, leder osv.)
  return (
    <>
      <ChangelogPopup />
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
          {/* CEO Routes */}
          <Route path="/ceo/team" element={<CEOTeamManagement />} />
          <Route path="/ceo/organizations" element={<CEOOrganizations />} />
          <Route path="/ceo/invite" element={<CEOInviteSalesperson />} />
          <Route path="/ceo/company" element={<CEOCompany />} />
          {/* Admin Routes */}
          <Route
            path="/admin/organizations"
            element={<OrganizationManagementPage />}
          />
          <Route path="/admin/invite" element={<InvitePage />} />
          <Route
            path="/auth"
            element={<Navigate to="/app/dashboard" replace />}
          />
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </>
  );
};
