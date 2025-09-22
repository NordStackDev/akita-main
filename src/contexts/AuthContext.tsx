import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    userData?: any
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
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

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

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
        const { data, error } = await supabase.rpc(
          "attach_auth_user_to_invited_user"
        );
        if (error) {
          console.warn("[Auth] attach_auth_user_to_invited_user error", error);
        } else {
          console.log("[Auth] attach_auth_user_to_invited_user result", data);
        }
      } catch (e) {
        console.warn("[Auth] attach_auth_user_to_invited_user threw", e);
      }
    };
    attach();
  }, [user]);

  // Soft delete: Log out user if deleted_at is set in users table
  useEffect(() => {
    if (user?.id) {
      supabase
        .from("users")
        .select("deleted_at")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.deleted_at) {
            supabase.auth.signOut();
            alert("Din konto er deaktiveret.");
          }
        });
    }
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
        data: userData,
      },
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
