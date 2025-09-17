import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleInvitationAcceptance = async (user: User) => {
    try {
      // Check if user has an invitation code to process
      const { data: invitation, error: inviteError } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('email', user.email?.toLowerCase())
        .is('used_at', null)
        .maybeSingle();

      if (inviteError || !invitation || !invitation.invited_role) {
        return;
      }

      // Mark invitation as used
      const { error: markUsedError } = await supabase
        .from('invitation_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (markUsedError) {
        console.error('Error marking invitation as used:', markUsedError);
        return;
      }

      // Assign role to user
      const { data: roleAssignment, error: roleError } = await supabase.rpc(
        'assign_user_role',
        {
          user_uuid: user.id,
          role_name: invitation.invited_role,
          org_id: invitation.invited_org_id,
        }
      );

      if (roleError) {
        console.error('Error assigning role:', roleError);
        return;
      }

      // Start onboarding process
      const { data: onboardingId, error: onboardingError } = await supabase.rpc(
        'start_user_onboarding',
        {
          user_uuid: user.id,
          role_name: invitation.invited_role,
          initial_data: {
            invitationId: invitation.id,
            firstName: invitation.first_name,
            lastName: invitation.last_name,
            phone: invitation.phone,
            companyName: invitation.company_name,
            organizationId: invitation.invited_org_id,
          },
        }
      );

      if (onboardingError) {
        console.error('Error starting onboarding:', onboardingError);
        return;
      }

      toast({
        title: "Invitation accepted!",
        description: `Welcome! Your role as ${invitation.invited_role} has been assigned.`,
      });

    } catch (error) {
      console.error('Error in invitation acceptance:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle invitation acceptance when user logs in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            handleInvitationAcceptance(session.user);
          }, 0);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ensure invited users are attached to their auth account (align ids)
  useEffect(() => {
    const attach = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      try {
        const { data, error } = await supabase.rpc('attach_auth_user_to_invited_user');
        if (error) {
          console.warn('[Auth] attach_auth_user_to_invited_user error', error);
        } else {
          console.log('[Auth] attach_auth_user_to_invited_user result', data);
        }
      } catch (e) {
        console.warn('[Auth] attach_auth_user_to_invited_user threw', e);
      }
    };
    attach();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    const redirectUrl = `${window.location.origin}/app/auth`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};