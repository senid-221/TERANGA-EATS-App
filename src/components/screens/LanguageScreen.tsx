import React from 'react';
import { motion } from 'motion/react';
import { Globe2, ArrowRight, Utensils } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LanguageSelector } from '../common/LanguageSelector';

export const LanguageScreen: React.FC = () => {
  const { language, setActiveScreen, t } = useApp();

  return (
    <div
      id="language-screen"
      className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md bg-white rounded-[36px] p-7 sm:p-9 border border-[#F0EDE8] shadow-artistic-lg text-center"
      >
        <div className="mx-auto mb-5 w-16 h-16 rounded-3xl bg-[#006633] text-[#FFCC00] flex items-center justify-center shadow-md">
          <Utensils className="w-7 h-7" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Globe2 className="w-5 h-5 text-[#006633]" />
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-[#2D2D2D]">
            {language === 'fr' ? 'Choisissez votre langue' : 'Choose your language'}
          </h1>
        </div>

        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-7">
          {language === 'fr'
            ? 'Sélectionnez votre langue avant de découvrir nos produits.'
            : 'Select your language before discovering our products.'}
        </p>

        <div className="flex justify-center mb-7">
          <LanguageSelector className="scale-110" />
        </div>

        <button
          id="btn-language-continue"
          type="button"
          onClick={() => setActiveScreen('products')}
          className="w-full h-12 rounded-2xl bg-[#006633] text-white font-black flex items-center justify-center gap-2 shadow-md hover:bg-[#005229] active:scale-[0.98] transition-all cursor-pointer"
        >
          {t('btnNext')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
