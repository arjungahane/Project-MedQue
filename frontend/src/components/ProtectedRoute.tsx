import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, isAuthenticated, isLoading, quickLoginAs } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" role="status">
        <span className="text-sm font-semibold text-slate-500">Restoring your secure session…</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const requiredRole = allowedRoles[0];

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Role Permission Required
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This module requires <strong className="text-slate-800 dark:text-slate-200 uppercase">{requiredRole}</strong> access. You are currently logged in as <strong className="uppercase">{role}</strong>.
          </p>

          {!isSupabaseConfigured && <div className="pt-2">
            <button
              onClick={() => quickLoginAs(requiredRole)}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all hover:scale-[1.02]"
            >
              <span>Instant Switch to {requiredRole.toUpperCase()} Demo Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
