import React, { ReactNode } from 'react';
import { APIProvider, APILoadingStatus, useApiLoadingStatus } from '@vis.gl/react-google-maps';
import { MapPin, Key, Sparkles, ExternalLink } from 'lucide-react';

interface GoogleMapsWrapperProps {
  children: ReactNode;
  className?: string;
  fallbackHeight?: string;
}

const InnerStatusChecker: React.FC<{ children: ReactNode; fallbackHeight: string }> = ({
  children,
  fallbackHeight,
}) => {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.LOADED) {
    return <>{children}</>;
  }

  if (status === APILoadingStatus.LOADING) {
    return (
      <div
        className={`w-full ${fallbackHeight} rounded-3xl bg-slate-900/90 text-white flex flex-col items-center justify-center p-6 border border-emerald-900/40 animate-pulse`}
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-[#25D366] flex items-center justify-center mb-3">
          <MapPin className="w-6 h-6 animate-bounce" />
        </div>
        <p className="text-sm font-bold text-white">Chargement de Google Maps...</p>
        <p className="text-xs text-gray-400 mt-1">Dakar, Sénégal 🇸🇳</p>
      </div>
    );
  }

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div
        className={`w-full ${fallbackHeight} rounded-3xl bg-[#0A1E2C] text-white flex flex-col items-center justify-center p-6 text-center border border-amber-500/30 relative overflow-hidden`}
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#FFCC00] flex items-center justify-center mb-3">
          <Key className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-black text-[#FFCC00] mb-1">Configuration Google Maps Platform</h4>
        <p className="text-xs text-gray-300 max-w-md mb-3">
          Pour activer les cartes interactives en direct à Dakar, ajoutez votre clé API Google Maps dans la variable{' '}
          <code className="bg-black/50 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[11px]">
            VITE_GOOGLE_MAPS_API_KEY
          </code>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-[#006633] text-white text-xs font-bold hover:bg-[#00552b] transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFCC00]" />
            <span>Obtenir une clé démo gratuite</span>
            <ExternalLink className="w-3 h-3 text-white/70" />
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({
  children,
  className = 'w-full h-full',
  fallbackHeight = 'h-72',
}) => {
  const apiKey = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY as string) || '';

  if (!apiKey) {
    // Graceful fallback with quick guide when key is not yet set
    return (
      <div
        className={`${className} ${fallbackHeight} min-h-[220px] rounded-3xl bg-[#0A1E2C] text-white flex flex-col items-center justify-center p-6 text-center border border-emerald-500/30 relative overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#25D366_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-[#25D366] flex items-center justify-center mb-2.5 shadow-lg border border-emerald-500/30">
            <MapPin className="w-6 h-6 text-[#25D366]" />
          </div>
          <h4 className="text-sm font-black text-white flex items-center gap-1.5">
            <span>Google Maps Dakar</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFCC00]/20 text-[#FFCC00] font-bold">
              Teranga 🇸🇳
            </span>
          </h4>
          <p className="text-xs text-gray-300 max-w-sm mt-1.5 mb-3 leading-relaxed">
            Visualisation cartographique des restaurants et du suivi des livreurs à Dakar.
          </p>
          <a
            href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#006633] to-[#046A38] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFCC00]" />
            <span>Activer avec Google Maps Demo Key</span>
            <ExternalLink className="w-3 h-3 text-white/80" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['places', 'marker', 'geometry']}>
      <div className={className}>
        <InnerStatusChecker fallbackHeight={fallbackHeight}>{children}</InnerStatusChecker>
      </div>
    </APIProvider>
  );
};
