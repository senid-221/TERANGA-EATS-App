import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { KeyRound, Utensils } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export const AuthScreen: React.FC = () => {
  const { t } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div id="auth-screen" className="min-h-screen bg-[#FDFBF7] p-4 sm:p-6 flex flex-col justify-between max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#006633] text-[#FFCC00] flex items-center justify-center font-black text-sm shadow-xs">
            <Utensils className="w-4 h-4" />
          </div>
          <span className="font-heading font-black text-lg text-[#006633]">
            Teranga<span className="text-[#E8702A]">Eats</span>
          </span>
        </div>
        <LanguageSelector />
      </div>

      {/* Main Container */}
      <div className="my-auto py-4">
        <div className="bg-white rounded-[36px] p-6 sm:p-8 border border-[#F0EDE8] shadow-artistic-lg flex flex-col items-center">
            <div className="text-center py-8 space-y-3">
              <KeyRound className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="font-heading text-xl font-black text-[#2D2D2D]">
                Authentification Requise
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                La connexion sécurisée n'est pas encore configurée sur cet environnement. Veuillez configurer le service d'authentification pour continuer.
              </p>
            </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-gray-400 pb-2 font-medium">
        <span>© 2026 Teranga Eats Dakar • Base Supabase & Authentification Sécurisée</span>
      </div>
    </div>
  );
};
