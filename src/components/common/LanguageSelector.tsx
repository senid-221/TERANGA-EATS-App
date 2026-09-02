import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useApp();

  return (
    <div
      id="language-selector"
      className={`inline-flex items-center p-1 bg-[#F7F5F0] rounded-full border border-[#F0EDE8] ${className}`}
    >
      <button
        id="btn-lang-fr"
        type="button"
        onClick={() => setLanguage('fr')}
        className={`relative px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
          language === 'fr'
            ? 'text-white'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        {language === 'fr' && (
          <motion.div
            layoutId="lang-pill"
            className="absolute inset-0 bg-[#006633] rounded-full shadow-xs"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10">FR 🇸🇳</span>
      </button>

      <button
        id="btn-lang-en"
        type="button"
        onClick={() => setLanguage('en')}
        className={`relative px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
          language === 'en'
            ? 'text-white'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        {language === 'en' && (
          <motion.div
            layoutId="lang-pill"
            className="absolute inset-0 bg-[#006633] rounded-full shadow-xs"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10">EN 🇬🇧</span>
      </button>
    </div>
  );
};
