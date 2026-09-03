import React from 'react';
import { useApp } from '../../context/AppContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import {
  Calendar,
  ChevronRight,
  CreditCard,
  Database,
  Globe,
  Headphones,
  HelpCircle,
  KeyRound,
  LogOut,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  Utensils,
} from 'lucide-react';

import { isSupabaseConfigured } from '../../lib/supabase';

export const ProfileScreen: React.FC = () => {
  const {
    t,
    language,
    currentUser,
    setCurrentUser,
    logout,
    deliveryAddress,
    bookings,
    setActiveScreen,
    openBookingModal,
    showToast,
    isSupabaseConnected,
        syncData,
  } = useApp();

  

  const handleSupportWhatsApp = () => {
    const text = encodeURIComponent('Bonjour Teranga Eats Dakar, j’ai une question depuis mon profil client.');
    window.open(`https://wa.me/221775784158?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = async () => {
        logout();
    showToast('Déconnexion réussie');
  };

  return (
    <div id="profile-screen" className="p-4 sm:p-6 pb-28 max-w-2xl mx-auto space-y-5">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[32px] p-6 border border-[#F0EDE8] shadow-artistic flex items-center gap-4">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] overflow-hidden ring-4 ring-emerald-50 shadow-md shrink-0">
          <img
            src={currentUser.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt={currentUser.fullName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-black text-lg sm:text-xl text-[#2D2D2D] truncate">
              {currentUser.fullName}
            </h2>
          </div>
          <p className="text-xs text-gray-500 font-medium truncate">{currentUser.phone}</p>
          {currentUser.email && (
            <p className="text-[11px] text-gray-400 font-medium truncate">{currentUser.email}</p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#006633] text-[11px] font-black border border-emerald-200 uppercase tracking-wider">
              {language === 'fr' ? 'Client Teranga Eats' : 'Teranga Eats Customer'}
            </span>
          </div>
        </div>
      </div>

      {/* Cloud & OAuth Integration Status */}
      <div className="bg-white rounded-[28px] p-4 sm:p-5 border border-[#F0EDE8] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#006633]" />
            <span className="text-xs font-black text-[#2D2D2D]">Connexions & Authentification</span>
          </div>
          <button
            onClick={async () => {
              await syncData();
              showToast('Données synchronisées avec Supabase !');
            }}
            className="text-[11px] font-black text-[#006633] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Synchroniser</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#F0EDE8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <div>
                <p className="text-xs font-bold text-[#2D2D2D]">Supabase Database</p>
                <p className="text-[10px] text-gray-500">{isSupabaseConnected ? 'Tables connectées' : 'Mode local'}</p>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {isSupabaseConnected ? 'En ligne' : 'Prêt'}
            </span>
          </div>

          
      </div>

      {/* WhatsApp Assistance Banner for Customer Support */}
      <div className="bg-gradient-to-r from-[#006633] via-[#075E54] to-[#128C7E] text-white rounded-[32px] p-5 sm:p-6 shadow-artistic flex items-center justify-between gap-4 border border-emerald-800 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#FFCC00] uppercase tracking-wider">
            <Headphones className="w-3.5 h-3.5" />
            <span>Service Client & Assistance Dakar</span>
          </div>
          <p className="text-xs text-emerald-100 leading-snug font-medium max-w-sm">
            Une question sur une commande, un restaurant ou une réservation ? Notre équipe à Dakar vous répond 24/7 sur WhatsApp.
          </p>
        </div>

        <button
          onClick={handleSupportWhatsApp}
          className="relative z-10 px-4 py-2.5 rounded-2xl bg-[#25D366] text-white font-black text-xs hover:bg-[#20bd5a] transition-all shrink-0 cursor-pointer flex items-center gap-2 active:scale-95 shadow-md border border-white/20"
        >
          <WhatsAppIcon className="w-4 h-4 fill-white" />
          <span>Aide WhatsApp</span>
        </button>
      </div>

      {/* Settings Sections */}
      <div className="bg-white rounded-[32px] p-2 sm:p-3 border border-[#F0EDE8] shadow-artistic divide-y divide-[#F0EDE8]">
        {/* Language Row */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F7F5F0] text-[#2D2D2D] flex items-center justify-center font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2D2D]">{t('language')}</p>
              <p className="text-[11px] text-gray-500 font-medium">Français / English</p>
            </div>
          </div>
          <LanguageSelector />
        </div>

        {/* My Table Bookings Row */}
        <button
          type="button"
          onClick={() => setActiveScreen('bookings_list')}
          className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#FDFBF7] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006633] flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-[#2D2D2D]">{t('myBookingsTitle')}</p>
                <span className="text-[10px] font-black uppercase text-[#006633] bg-emerald-100 px-2 py-0.5 rounded-full">
                  Tables
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                {bookings.length} réservation(s) enregistrée(s)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#006633]">Voir</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Saved Addresses */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006633] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2D2D]">{t('savedAddresses')}</p>
              <p className="text-[11px] text-gray-500 font-medium truncate max-w-[200px]">
                {deliveryAddress.neighborhood} — {deliveryAddress.streetAddress}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Payment Methods */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2D2D]">{t('stepPayment')}</p>
              <p className="text-[11px] text-gray-500 font-medium">Wave • Orange Money • Espèces</p>
            </div>
          </div>
          <span className="text-xs font-black text-[#006633] bg-emerald-50 px-2.5 py-1 rounded-full">Actifs</span>
        </div>

        {/* WhatsApp Senegal Support Direct */}
        <button
          onClick={handleSupportWhatsApp}
          className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#FDFBF7] transition-colors rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center">
              <WhatsAppIcon className="w-5 h-5 fill-[#25D366]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2D2D]">{t('supportWhatsApp')}</p>
              <p className="text-[11px] text-gray-500 font-medium">+221 77 578 41 58 (Assistance Client Dakar)</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        {/* Security & Privacy */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2D2D]">Confidentialité & Sécurité</p>
              <p className="text-[11px] text-gray-500 font-medium">Données protégées au Sénégal</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 rounded-2xl bg-white border border-red-200 text-red-600 font-black text-xs hover:bg-red-50 cursor-pointer transition-all active:scale-98 shadow-artistic flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>{t('logout')}</span>
      </button>
    </div>
  );
};
