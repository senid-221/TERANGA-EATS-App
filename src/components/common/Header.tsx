import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LanguageSelector } from './LanguageSelector';
import { Bell, ChevronDown, MapPin } from 'lucide-react';
import { DAKAR_NEIGHBORHOODS } from '../../data/constants';
import { motion, AnimatePresence } from 'motion/react';

export const Header: React.FC = () => {
  const {
    t,
    currentUser,
    currentNeighborhood,
    setCurrentNeighborhood,
    unreadNotificationsCount,
    setActiveTab,
  } = useApp();

  const [showLocationModal, setShowLocationModal] = useState(false);

  return (
    <>
      <header id="main-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 border-b border-[#F0EDE8] shadow-artistic">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: User Avatar, Title & Role */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              id="header-profile-btn"
              onClick={() => setActiveTab('profile')}
              className="relative cursor-pointer group"
              aria-label="Profil"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#006633] text-white flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform overflow-hidden ring-2 ring-[#FFCC00]">
                {currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="font-heading font-black text-sm text-white">
                    {currentUser.fullName.split(' ').map(n => n[0]).join('.')}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FFCC00] border-2 border-white rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-[#006633] rounded-full" />
              </div>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#006633] uppercase">
                  Dakar Express
                </span>
                <span className="text-gray-300 text-xs">•</span>
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-50 text-[#006633] border border-emerald-200 uppercase tracking-wider">
                  Teranga 🇸🇳
                </span>
              </div>

              <h1 className="text-base sm:text-xl font-extrabold text-[#2D2D2D] flex items-center gap-1.5 mt-0.5">
                <span>{t('greeting')} 👋</span>
                <span className="text-[#006633] italic truncate max-w-[130px] sm:max-w-[200px]">
                  {currentUser.fullName.split(' ')[0]}
                </span>
              </h1>
            </div>
          </div>

          {/* Right: Location Trigger & Language + Notifications */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Delivery address display pill */}
            <button
              id="header-location-btn"
              onClick={() => setShowLocationModal(true)}
              className="text-right hidden sm:flex flex-col items-end cursor-pointer group"
            >
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-black">
                Livrer à / Deliver to
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-[#E8702A] flex items-center gap-1 group-hover:underline">
                <MapPin className="w-3.5 h-3.5 fill-[#E8702A] text-[#E8702A]" />
                <span>{currentNeighborhood.name}, Dakar</span>
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:translate-y-0.5 transition-transform" />
              </p>
            </button>

            {/* Mobile small location pin */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="sm:hidden p-2 rounded-xl bg-[#F7F5F0] text-[#E8702A] border border-[#F0EDE8] cursor-pointer hover:bg-orange-50 transition-colors flex items-center gap-1 text-xs font-bold"
              aria-label="Quartier de livraison"
            >
              <MapPin className="w-3.5 h-3.5 fill-[#E8702A]" />
              <span className="truncate max-w-[70px] text-[11px] text-[#2D2D2D]">
                {currentNeighborhood.name}
              </span>
            </button>

            <LanguageSelector />

            <button
              id="header-notif-btn"
              onClick={() => setActiveTab('notifications')}
              className="relative p-2.5 text-[#2D2D2D] hover:text-[#006633] bg-[#F7F5F0] hover:bg-[#F0EDE8] rounded-2xl border border-[#F0EDE8] shadow-xs cursor-pointer transition-all active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-[#2D2D2D]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#E8702A] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#046A38] flex items-center justify-center font-bold">
                    🇸🇳
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Quartiers de Dakar</h3>
                    <p className="text-xs text-gray-600">Choisissez votre zone de livraison</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto py-3 space-y-2 flex-1">
                {DAKAR_NEIGHBORHOODS.map((hood) => {
                  const isSelected = hood.id === currentNeighborhood.id;
                  return (
                    <button
                      key={hood.id}
                      onClick={() => {
                        setCurrentNeighborhood(hood);
                        setShowLocationModal(false);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-50/80 border-[#046A38] shadow-xs'
                          : 'bg-white border-gray-100 hover:border-emerald-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-[#046A38] text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{hood.name}</p>
                          <p className="text-xs text-gray-600">{hood.zone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-[#046A38]">
                          {hood.deliveryFee} FCFA
                        </p>
                        <p className="text-[11px] text-gray-600">{hood.deliveryTimeEstimate}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-100">
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="w-full py-3 bg-[#046A38] text-white font-bold rounded-xl text-sm hover:bg-[#03522C] transition-colors cursor-pointer"
                >
                  Confirmer la localisation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
