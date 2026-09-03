import React, { useEffect, useState } from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
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
  const [clerkTimeout, setClerkTimeout] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setClerkTimeout(false);
      return;
    }
    const timer = window.setTimeout(() => setClerkTimeout(true), 12000);
    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  if (!isLoaded) {
    if (clerkTimeout) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="w-full max-w-lg rounded-2xl border border-amber-500/20 bg-slate-900 p-8 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-amber-400" />
            <h1 className="mt-4 text-xl font-bold">Admin authentication is taking too long</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              TerangaEats could not finish connecting to Clerk. Check the Clerk domain/origin
              configuration and the VITE_CLERK_PUBLISHABLE_KEY used during the production build.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      );
    }

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
