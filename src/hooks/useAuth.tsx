import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  profile: any;
  session: Session | null;
  loading: boolean;
  signUp: (username: string, password: string) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signUp = async (username: string, password: string) => {
    // Generate a valid fake email that won't trigger validation
    const fakeEmail = `${username}.user@example.com`;
    
    const { error } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
      options: {
        data: {
          username: username
        }
      }
    });
    
    // Convert email-related errors to username-friendly messages
    if (error) {
      if (error.message.includes('email') || error.message.includes('Email')) {
        return { error: { ...error, message: 'Username already exists or invalid' } };
      }
    }
    
    return { error };
  };

  const signIn = async (username: string, password: string) => {
    const fakeEmail = `${username}.user@example.com`;
    const { error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    });
    
    // Convert email-related errors to username-friendly messages
    if (error) {
      if (error.message.includes('email') || error.message.includes('Email')) {
        return { error: { ...error, message: 'Invalid username or password' } };
      }
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};