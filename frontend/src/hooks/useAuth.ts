import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export interface AuthContextType {
  user: { id: number; username: string; email?: string } | null;
  token: string | null;
  login: (userData: { id: number; username: string; email?: string }, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(redirectTo: string = '/login'): {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthContextType['user'];
} {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.isAuthenticated && !auth.isLoading) {
    navigate(redirectTo, { replace: true });
  }

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading ?? false,
    user: auth.user,
  };
}
