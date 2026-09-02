import React from 'react';
import { useApp } from '../../context/AppContext';
import { Heart, Home, Search, ShoppingBag, User } from 'lucide-react';
import { motion } from 'motion/react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, cartCount, t } = useApp();

  const tabs = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'search', label: t('navSearch'), icon: Search },
    { id: 'cart', label: t('navCart'), icon: ShoppingBag, badge: cartCount },
    { id: 'favorites', label: t('navFavorites'), icon: Heart },
    { id: 'profile', label: t('navProfile'), icon: User },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#F0EDE8] px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer select-none ${
                isActive ? 'text-[#006633]' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-0 bg-[#F7F5F0] rounded-2xl -z-10 border border-[#F0EDE8]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5px] text-[#006633]' : 'stroke-2 text-gray-500'
                  }`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-[#E8702A] text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-xs"
                  >
                    {tab.badge}
                  </motion.span>
                )}
              </div>

              <span
                className={`text-[11px] mt-1 tracking-tight transition-all ${
                  isActive ? 'text-[#006633] font-black' : 'text-gray-500 font-semibold'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
