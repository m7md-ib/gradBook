import { authEndpoints, type LoginPayload, type SignupPayload } from '@/api/endpoints/auth';
import type { AuthUser } from '@/types/api';

export const authService = {
  signup: (payload: SignupPayload): Promise<AuthUser> => authEndpoints.signup(payload),
  login: (payload: LoginPayload): Promise<AuthUser> => authEndpoints.login(payload),
  logout: (): Promise<void> => authEndpoints.logout(),
  currentUser: (): Promise<AuthUser> => authEndpoints.me(),
  isAdmin: (user: AuthUser | null | undefined): boolean => user?.role === 'admin',
};
