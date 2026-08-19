import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/features/authentication/types';
import { authService } from '@/features/authentication/services/auth.service';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  /** Verdadeiro enquanto a checagem inicial de sessão (`/api/auth/me`) ainda está em voo. */
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // O token vive num cookie httpOnly, invisível pro JS por design — a única forma de saber se
  // já existe uma sessão válida (ex: usuário deu F5 na página) é perguntar pro backend.
  useEffect(() => {
    let cancelled = false;
    authService
      .me()
      .then((fetchedUser) => {
        if (!cancelled) setUser(fetchedUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
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
