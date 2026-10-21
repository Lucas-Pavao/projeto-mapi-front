import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { sessionEvents } from '@/lib/session';
import type { User } from '@/features/authentication/types';
import { authService } from '@/features/authentication/services/auth.service';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  /** Verdadeiro enquanto a checagem inicial de sessão (`/api/auth/me`) ainda está em voo. */
  isLoading: boolean;
  /** A sessão acabou no meio do uso (refresh falhou ou 403 na checagem). Some ao entrar de novo. */
  sessionExpired: boolean;
  /** O perfil mudou depois de renovar o token (some sozinho em poucos segundos ou ao ser consumido). */
  roleChanged: boolean;
  clearRoleChanged: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [roleChanged, setRoleChanged] = useState(false);
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const clearRoleChanged = useCallback(() => setRoleChanged(false), []);

  // Sessão renovada (token com perfil novo): refaz /me, reaplica guardas e Nav. Sessão perdida: logout.
  useEffect(
    () =>
      sessionEvents.on((e) => {
        if (e === 'expired') {
          // Sem sessão conhecida (visitante, ou checagem inicial): não há o que derrubar.
          if (userRef.current) {
            setUser(null);
            setSessionExpired(true);
          }
          return;
        }
        authService
          .me()
          .then((fresh) => {
            const prev = userRef.current;
            setUser(fresh);
            if (prev && prev.role !== fresh.role) setRoleChanged(true);
          })
          .catch(() => {
            setUser(null);
            setSessionExpired(true);
          });
      }),
    [],
  );
  useEffect(() => {
    if (!roleChanged) return;
    const t = setTimeout(() => setRoleChanged(false), 8000);
    return () => clearTimeout(t);
  }, [roleChanged]);

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
    setSessionExpired(false);
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
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading, sessionExpired, roleChanged, clearRoleChanged }}>
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
