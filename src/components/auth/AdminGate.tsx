import React, { useEffect, useState } from 'react';
import { ShieldAlert, Loader2, LogIn } from 'lucide-react';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';

export const AdminGate: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/admin/session', { credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      setAuthenticated(Boolean(response.ok && data.ok && data.authenticated));
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkSession(); }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setError(data.error || 'Invalid admin email or password.');
        return;
      }
      await checkSession();
      setPassword('');
    } catch {
      setError('Unable to connect to the admin server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="h-7 w-7 animate-spin text-emerald-400" /></div>;
  if (authenticated) return <AdminDashboardScreen />;

  return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white"><div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"><div className="text-center mb-7"><div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center"><ShieldAlert className="h-6 w-6 text-emerald-400" /></div><h1 className="text-2xl font-bold">TerangaEats Admin</h1><p className="mt-1 text-sm text-slate-400">Sign in to access the control center.</p></div><form onSubmit={login} className="space-y-4"><div><label className="mb-1.5 block text-sm text-slate-300">Admin email</label><input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500" placeholder="admin@example.com" /></div><div><label className="mb-1.5 block text-sm text-slate-300">Password</label><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500" placeholder="••••••••" /></div>{error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}<button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}{submitting ? 'Signing in…' : 'Sign in'}</button></form></div></div>;
};
