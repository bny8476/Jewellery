import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any; error: any }>;
  signUp: (email: string, password: string, options?: { data?: Record<string, any> }) => Promise<{ data?: any; error: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        const currentSession = data?.session ?? null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Initial session lookup:', err);
        if (isMounted) setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!error && data?.session) {
        setSession(data.session);
        setUser(data.user);
      }

      return { data, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  };

  const signUp = async (email: string, password: string, options?: { data?: Record<string, any> }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          data: options?.data || { role: 'customer' }
        }
      });

      if (!error && data?.session) {
        setSession(data.session);
        setUser(data.user);
      }

      return { data, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setSession(null);
      setUser(null);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

