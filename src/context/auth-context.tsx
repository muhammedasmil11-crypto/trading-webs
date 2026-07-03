'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, MarketType } from '../types';
import { getCurrentUser, loginUser, registerUser, logoutUser, updateUserProfile, LoginInput, RegisterInput } from '../services/auth';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'passwordHash' | 'createdAt'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          if (!currentUser.isOnboarded) {
            if (pathname && !pathname.startsWith('/auth/onboarding')) {
              router.push('/auth/onboarding');
            }
          } else {
            if (pathname && pathname.startsWith('/auth')) {
              router.push('/');
            }
          }
        } else {
          // If not authenticated and not on login/signup page, redirect to login
          if (pathname && !pathname.startsWith('/auth')) {
            router.push('/auth/login');
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth', err);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, [pathname, router]);

  const login = async (input: LoginInput) => {
    setIsLoading(true);
    try {
      const loggedInUser = await loginUser(input);
      setUser(loggedInUser);
      if (!loggedInUser.isOnboarded) {
        router.push('/auth/onboarding');
      } else {
        router.push('/');
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (input: RegisterInput) => {
    setIsLoading(true);
    try {
      const newUser = await registerUser(input);
      setUser(newUser);
      router.push('/auth/onboarding');
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    router.push('/auth/login');
  };

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'passwordHash' | 'createdAt'>>) => {
    if (!user) throw new Error('Not authenticated');
    const updated = await updateUserProfile(user.id, updates);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
