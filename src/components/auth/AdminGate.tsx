import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';

const configuredAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

const configuredAdminUserIds = (import.meta.env.VITE_ADMIN_USER_IDS || '')
  .split(',')
  .map((id: string) => id.trim())
  .filter(Boolean);

export const AdminGate: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          Checking admin access…
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 text-white">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold">TerangaEats Admin</h1>
            <p className="mt-1 text-sm text-slate-400">Sign in to access the control center.</p>
          </div>
          <SignIn routing="hash" />
        </div>
      </div>
    );
  }

  const metadataRole = user.publicMetadata?.role;
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
  const isAdmin =
    metadataRole === 'admin' ||
    configuredAdminUserIds.includes(user.id) ||
    configuredAdminEmails.includes(email);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md text-center rounded-2xl border border-red-500/20 bg-slate-900 p-8">
          <ShieldAlert className="mx-auto h-10 w-10 text-red-400" />
          <h1 className="mt-4 text-xl font-bold">Access denied</h1>
          <p className="mt-2 text-sm text-slate-400">
            This account is authenticated but does not have administrator permissions.
          </p>
        </div>
      </div>
    );
  }

  return <AdminDashboardScreen />;
};
