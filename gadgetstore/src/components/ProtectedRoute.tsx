import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading, initialized } = useAuthStore();
  if (!initialized || isLoading) return <div className="flex items-center justify-center min-h-screen bg-background text-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, isLoading, initialized } = useAuthStore();
  if (!initialized || isLoading) return <div className="flex items-center justify-center min-h-screen bg-background text-foreground">Loading...</div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};
