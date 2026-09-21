import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { AuthUser } from '@/types/api';
import type { LoginPayload, SignupPayload } from '@/api/endpoints/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  signup: (payload: SignupPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
  isSigningUp: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authService.currentUser,
    retry: false,
    staleTime: 60_000,
    throwOnError: false,
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (user) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
  });

  const signupMutation = useMutation({
    mutationFn: authService.signup,
    onSuccess: (user) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear();
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      isLoading: meQuery.isLoading,
      isAuthenticated: Boolean(meQuery.data),
      isAdmin: meQuery.data?.role === 'admin',
      login: (payload) => loginMutation.mutateAsync(payload),
      signup: (payload) => signupMutation.mutateAsync(payload),
      logout: () => logoutMutation.mutateAsync(),
      isLoggingIn: loginMutation.isPending,
      isSigningUp: signupMutation.isPending,
    }),
    [meQuery.data, meQuery.isLoading, loginMutation, signupMutation, logoutMutation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
