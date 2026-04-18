import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getToken, removeToken, verifyToken } from '../services/api';

interface User {
  id: number;
  nombre: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
  setUser: () => {},
  setToken: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const storedToken = await getToken();
      if (storedToken) {
        const data = await verifyToken();
        setUser(data.user);
        setToken(storedToken);
      }
    } catch {
      // Token expired or invalid — clear it
      await removeToken();
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    await removeToken();
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        logout,
        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
