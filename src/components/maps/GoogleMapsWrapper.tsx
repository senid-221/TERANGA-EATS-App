import React, { ReactNode } from 'react';
import { APIProvider, APILoadingStatus, useApiLoadingStatus } from '@vis.gl/react-google-maps';
import { MapPin, AlertTriangle } from 'lucide-react';

interface GoogleMapsWrapperProps { children: ReactNode; className?: string; fallbackHeight?: string; }

const InnerStatusChecker: React.FC<{ children: ReactNode; fallbackHeight: string }> = ({ children, fallbackHeight }) => {
  const status = useApiLoadingStatus();
  if (status === APILoadingStatus.LOADED) return <>{children}</>;
  if (status === APILoadingStatus.LOADING) return <div className={`w-full ${fallbackHeight} rounded-3xl bg-slate-900/90 text-white flex flex-col items-center justify-center p-6 border border-emerald-900/40 animate-pulse`}><div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-[#25D366] flex items-center justify-center mb-3"><MapPin className="w-6 h-6 animate-bounce" /></div><p className="text-sm font-bold text-white">Chargement de Google Maps...</p><p className="text-xs text-gray-400 mt-1">Dakar, Sénégal 🇸🇳</p></div>;
  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) return <div className={`w-full ${fallbackHeight} rounded-3xl bg-[#0A1E2C] text-white flex flex-col items-center justify-center p-6 text-center border border-amber-500/30`}><div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#FFCC00] flex items-center justify-center mb-3"><AlertTriangle className="w-6 h-6" /></div><h4 className="text-sm font-black text-[#FFCC00] mb-1">Google Maps n'est pas disponible</h4><p className="text-xs text-gray-300 max-w-md">Vérifiez la variable <code className="bg-black/50 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code>, les APIs activées et les restrictions de la clé dans Google Cloud.</p></div>;
  return <>{children}</>;
};

export const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({ children, className = 'w-full h-full', fallbackHeight = 'h-72' }) => {
  const apiKey = String((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  if (!apiKey) return <div className={`${className} ${fallbackHeight} min-h-[220px] rounded-3xl bg-[#0A1E2C] text-white flex flex-col items-center justify-center p-6 text-center border border-emerald-500/30`}><div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-[#25D366] flex items-center justify-center mb-2.5"><MapPin className="w-6 h-6" /></div><h4 className="text-sm font-black text-white">Google Maps</h4><p className="text-xs text-gray-300 max-w-sm mt-1.5 leading-relaxed">Ajoutez VITE_GOOGLE_MAPS_API_KEY dans les variables d'environnement de production pour activer les cartes.</p></div>;
  return <APIProvider apiKey={apiKey} libraries={['places', 'marker', 'geometry']}><div className={className}><InnerStatusChecker fallbackHeight={fallbackHeight}>{children}</InnerStatusChecker></div></APIProvider>;
};
