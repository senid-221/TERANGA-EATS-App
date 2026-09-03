import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import { Sparkles, Utensils } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const { setActiveScreen, t, language, isAuthenticated } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        setActiveScreen('app');
      } else {
        setActiveScreen('onboarding');
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [setActiveScreen, isAuthenticated]);

  return (
    <div
      id="splash-screen"
      onClick={() => setActiveScreen(isAuthenticated ? 'app' : 'onboarding')}
      className="relative min-h-screen w-full bg-gradient-to-b from-[#006633] via-[#044D26] to-[#012E17] flex flex-col items-center justify-between p-8 text-white select-none cursor-pointer overflow-hidden"
    >
      {/* Background Decorative Senegal Waves */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#FFCC00] blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#E8702A] blur-3xl" />
      </div>

      <div className="w-full flex justify-end">
        <span className="text-xs font-bold px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          🇸🇳 Dakar, Sénégal
        </span>
      </div>

      {/* Center Animated Logo & Branding */}
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative mb-6"
        >
          {/* Logo 3D Badge */}
          <div className="w-28 h-28 rounded-[32px] bg-gradient-to-tr from-[#FFCC00] to-[#E8702A] p-1 shadow-[0_16px_36px_rgba(0,0,0,0.4)] flex items-center justify-center">
            <div className="w-full h-full bg-[#006633] rounded-[28px] flex flex-col items-center justify-center p-3 text-center border border-white/30">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Utensils className="w-8 h-8 text-[#FFCC00]" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-[#FFCC00] uppercase">
                Teranga
              </span>
            </div>
          </div>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#E8702A] text-white flex items-center justify-center shadow-md border-2 border-white/40"
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-heading text-4xl sm:text-5xl font-black tracking-tight text-white mb-2"
        >
          Teranga<span className="text-[#FFCC00]">Eats</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-emerald-100 text-sm sm:text-base font-medium max-w-xs leading-relaxed"
        >
          {t('brandTagline')}
        </motion.p>
      </div>

      {/* Footer hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-2 text-xs text-emerald-200 font-medium">
          <span className="w-2 h-2 rounded-full bg-[#FFCC00] animate-ping" />
          <span>{language === 'fr' ? 'Touchez pour continuer...' : 'Tap to continue...'}</span>
        </div>
      </motion.div>
    </div>
  );
};
