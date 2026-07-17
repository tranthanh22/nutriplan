export type AppRole = 'customer' | 'kitchen_staff' | 'admin';

export interface AuthUser {
  id: string;
  email?: string;
  role: AppRole;
  accessToken: string;
}
