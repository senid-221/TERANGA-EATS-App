import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Primary3DButton } from '../common/Primary3DButton';
import { LanguageSelector } from '../common/LanguageSelector';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { Lock, Mail, Phone, ShieldCheck, User, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthScreen: React.FC = () => {
  const { t, login, register, setActiveScreen, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+221 77 543 21 00');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (mode === 'login') {
        login(phone || email, password);
        setActiveScreen('app');
        showToast('Connexion réussie ! Bienvenue sur Teranga Eats.');
      } else if (mode === 'register') {
        if (!fullName || !phone) {
          showToast(t('fillRequiredFields'));
          return;
        }
        register(fullName, phone, email, password);
        setActiveScreen('app');
        showToast('Compte créé avec succès !');
      } else {
        showToast('Code de réinitialisation envoyé par SMS.');
        setMode('login');
      }
    }, 800);
  };

  return (
    <div id="auth-screen" className="min-h-screen bg-[#FDFBF7] p-4 sm:p-6 flex flex-col justify-between max-w-md mx-auto">
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
      <div className="my-auto py-6">
        <div className="bg-white rounded-[36px] p-6 sm:p-8 border border-[#F0EDE8] shadow-artistic-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="font-heading text-2xl font-black text-[#2D2D2D] mb-1">
              {mode === 'login'
                ? t('loginTitle')
                : mode === 'register'
                ? t('registerTitle')
                : t('forgotPasswordTitle')}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              {mode === 'login'
                ? t('loginSubtitle')
                : mode === 'register'
                ? t('registerSubtitle')
                : t('forgotPasswordDesc')}
            </p>
          </div>

          {/* Tab switch for Login / Register */}
          {mode !== 'forgot' && (
            <div className="flex bg-[#F7F5F0] p-1.5 rounded-2xl mb-5 border border-[#F0EDE8]">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-[#006633] shadow-xs'
                    : 'text-gray-500 hover:text-[#2D2D2D]'
                }`}
              >
                {t('signIn')}
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-[#006633] shadow-xs'
                    : 'text-gray-500 hover:text-[#2D2D2D]'
                }`}
              >
                {t('signUp')}
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Fatou Ndiaye"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {t('phone')} (Sénégal) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#006633] flex items-center gap-1">
                  🇸🇳 +221
                </span>
                <input
                  type="tel"
                  required
                  value={phone.replace('+221 ', '')}
                  onChange={(e) => setPhone(`+221 ${e.target.value}`)}
                  placeholder="77 123 45 67"
                  className="w-full pl-22 pr-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {t('email')} (Optionnel)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fatou@example.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none"
                />
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#2D2D2D] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    {t('password')} *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] font-black text-[#006633] hover:underline cursor-pointer"
                    >
                      {t('forgotPassword')}
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none"
                />
              </div>
            )}

            <div className="pt-2">
              <Primary3DButton
                id="btn-auth-submit"
                type="submit"
                loading={loading}
                size="md"
              >
                {mode === 'login'
                  ? t('signIn')
                  : mode === 'register'
                  ? t('signUp')
                  : t('sendResetCode')}
              </Primary3DButton>
            </div>

            {mode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-black text-[#006633] hover:underline cursor-pointer"
                >
                  Retour à la connexion
                </button>
              </div>
            )}
          </form>

          {/* WhatsApp Customer Assistance Direct Link */}
          <div className="mt-6 pt-5 border-t border-[#F0EDE8]">
            <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#EAE2D5] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs shrink-0">
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#2D2D2D]">Besoin d'aide pour vous connecter ?</p>
                  <p className="text-[11px] text-gray-500 font-medium">WhatsApp Assistance Dakar 24/7</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const text = encodeURIComponent('Bonjour Teranga Eats Dakar, j’ai besoin d’aide pour me connecter à mon compte.');
                  window.open(`https://wa.me/221775784158?text=${text}`, '_blank', 'noopener,noreferrer');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                <span>Aide WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-gray-400 pb-2 font-medium">
        <span>© 2026 Teranga Eats Dakar • 100% Sénégalais</span>
      </div>
    </div>
  );
};
