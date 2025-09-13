'use client';

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import type { Student, Faculty } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, a: string) => Promise<any>;
  signUp: (
    name: string,
    email: string,
    pass: string
  ) => Promise<any>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getRoleFromEmail = (email: string): UserRole => {
  if (email.endsWith('@admin.schedulo.com')) {
    return 'admin';
  } else if (email.endsWith('@faculty.schedulo.com')) {
    return 'faculty';
  }
  return 'student';
};

const setUserFromSession = async (session: any): Promise<User | null> => {
  if (!session?.user) return null;
  const email = session.user.email!;
  const role = getRoleFromEmail(email);

  let user: User = {
    id: session.user.id,
    email: email,
    name: session.user.user_metadata?.full_name || email,
    role: role,
  };

  // If student or faculty, fetch the extra details from public tables
  if (role === 'student') {
    const { data: studentData } = await supabase
      .from('students')
      .select('major, department')
      .eq('id', session.user.id)
      .single();
    if (studentData) {
      user = { ...user, ...studentData };
    }
  } else if (role === 'faculty') {
      const { data: facultyData } = await supabase
        .from('faculty')
        .select('department')
        .eq('id', session.user.id)
        .single();
    if (facultyData) {
        user = { ...user, ...facultyData };
    }
  }
  return user;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const updatedUser = await setUserFromSession(session);
    setUser(updatedUser);
  }, []);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const initialUser = await setUserFromSession(session);
      setUser(initialUser);
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          const updatedUser = await setUserFromSession(session);
          setUser(updatedUser);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
    getInitialSession();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string): Promise<any> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error;
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
  ) => {
    const role = getRoleFromEmail(email);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          userrole: role,
        },
      },
    });
    return error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, loading: false, refreshUser }}>
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
