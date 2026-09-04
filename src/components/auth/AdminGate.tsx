import React, { Component, ErrorInfo, useEffect, useState } from 'react';
import { ShieldAlert, Loader2, LogIn, AlertTriangle } from 'lucide-react';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { DriverAssignmentPanel } from '../admin/DriverAssignmentPanel';
import { AdminLiveMap } from '../admin/AdminLiveMap';
import { useApp } from '../../context/AppContext';

class AdminDashboardErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Admin dashboard render error:', error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white"><div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center shadow-2xl"><AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-400"/><h1 className="text-xl font-bold">Admin Dashboard could not be loaded</h1><p className="mt-2 text-sm text-slate-400">Please refresh the page and try again.</p><button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">Refresh Dashboard</button></div></div>;
  }
}

const AdminDashboardBridge: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { syncData, showToast, orders } = useApp();
  useEffect(() => {
    const handleClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null; if (!target) return;
      const button = target.closest('button'); const label = button?.textContent?.replace(/\s+/g, ' ').trim();
      if (label === 'Actualiser DB') { event.preventDefault(); event.stopPropagation(); try { await syncData(); showToast('Base de données actualisée.'); } catch { showToast('Impossible d’actualiser la base de données.'); } return; }
      if (label === 'Déconnexion') { event.preventDefault(); event.stopPropagation(); try { await fetch('/api/admin/logout', { method:'POST', credentials:'include' }); } finally { onLogout(); } return; }
      const localBadge = Array.from(document.querySelectorAll('span')).find(node => node.textContent?.trim() === '● Base locale');
      if (localBadge && localBadge.contains(target)) { event.preventDefault(); event.stopPropagation(); showToast('Mode Base locale actif. Les données locales restent disponibles.'); }
    };
    document.addEventListener('click', handleClick, true); return () => document.removeEventListener('click', handleClick, true);
  }, [syncData, showToast, onLogout]);
  return <AdminDashboardErrorBoundary><AdminDashboardScreen /><div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8"><DriverAssignmentPanel orders={orders} /></div><div className="max-w-7xl mx-auto px-4 sm:px-6 pb-28"><AdminLiveMap /></div></AdminDashboardErrorBoundary>;
};

export const AdminGate: React.FC = () => {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [loading,setLoading]=useState(true); const [submitting,setSubmitting]=useState(false); const [error,setError]=useState(''); const [authenticated,setAuthenticated]=useState(false);
  const checkSession=async()=>{try{const response=await fetch('/api/admin/session',{credentials:'include'});const data=await response.json().catch(()=>({}));setAuthenticated(Boolean(response.ok&&data.ok));}catch{setAuthenticated(false);}finally{setLoading(false);}};
  useEffect(()=>{void checkSession();},[]);
  const login=async(event:React.FormEvent)=>{event.preventDefault();if(submitting)return;setSubmitting(true);setError('');try{const response=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({email,password})});const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok){setError('Email or password is incorrect');setSubmitting(false);return;}const sessionResponse=await fetch('/api/admin/session',{credentials:'include'});const sessionData=await sessionResponse.json().catch(()=>({}));if(!sessionResponse.ok||!sessionData.ok){setError('Unable to start admin session. Please try again.');setSubmitting(false);return;}setPassword('');setError('');await new Promise(resolve=>setTimeout(resolve,3000));setAuthenticated(true);}catch{setError('Unable to connect to the admin server.');}finally{setSubmitting(false);}};
  if(loading)return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="h-7 w-7 animate-spin text-emerald-400"/></div>;
  if(authenticated)return <AdminDashboardBridge onLogout={()=>setAuthenticated(false)}/>;
  return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white"><div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"><div className="text-center mb-7"><div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center"><ShieldAlert className="h-6 w-6 text-emerald-400"/></div><h1 className="text-2xl font-bold">TerangaEats Admin</h1><p className="mt-1 text-sm text-slate-400">Sign in to access the control center.</p></div><form onSubmit={login} className="space-y-4"><div><label className="mb-1.5 block text-sm text-slate-300">Admin email</label><input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500" placeholder="admin@example.com"/></div><div><label className="mb-1.5 block text-sm text-slate-300">Password</label><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500" placeholder="••••••••"/></div>{error&&<div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}<button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">{submitting?<Loader2 className="h-4 w-4 animate-spin"/>:<LogIn className="h-4 w-4"/>}{submitting?'Signing in…':'Sign in'}</button></form></div></div>;
};
