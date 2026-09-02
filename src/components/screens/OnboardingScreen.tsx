import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Primary3DButton } from '../common/Primary3DButton';
import { LanguageSelector } from '../common/LanguageSelector';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OnboardingScreen: React.FC = () => {
  const { setActiveScreen, t, language } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: t('onboarding1Title'),
      desc: t('onboarding1Desc'),
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
      badge: '🇸🇳 Thiéboudienne & Spécialités',
      tag: 'Gastronomie Dakaroise',
    },
    {
      title: t('onboarding2Title'),
      desc: t('onboarding2Desc'),
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80',
      badge: '☕ Café Touba & Jus de Bissap',
      tag: 'Fraîcheur & Rapidité',
    },
    {
      title: t('onboarding3Title'),
      desc: t('onboarding3Desc'),
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
      badge: '💳 Wave • Orange Money • Espèces',
      tag: '100% Sécurisé',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      setActiveScreen('auth');
    }
  };

  const handleSkip = () => {
    setActiveScreen('auth');
  };

  return (
    <div id="onboarding-screen" className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between p-6 max-w-md mx-auto">
      {/* Header with Language Selector & Skip */}
      <div className="flex items-center justify-between pt-2">
        <LanguageSelector />
        <button
          onClick={handleSkip}
          className="text-xs font-bold text-gray-500 hover:text-[#2D2D2D] cursor-pointer px-3.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          {t('btnSkip')}
        </button>
      </div>

      {/* Main Slide Content */}
      <div className="my-auto py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            {/* Image Card with 3D depth */}
            <div className="relative w-full h-72 sm:h-80 rounded-[36px] overflow-hidden shadow-artistic-lg mb-6 border border-[#F0EDE8]">
              <img
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#006633] text-xs font-black shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFCC00] fill-[#FFCC00]" />
                  {slides[currentSlide].tag}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block px-3.5 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                  {slides[currentSlide].badge}
                </span>
              </div>
            </div>

            {/* Typography */}
            <h2 className="font-heading text-2xl sm:text-3xl font-black text-[#2D2D2D] mb-2 leading-tight">
              {slides[currentSlide].title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-sm leading-relaxed font-medium">
              {slides[currentSlide].desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Smooth Page Indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide ? 'w-8 bg-[#006633]' : 'w-2 bg-[#F0EDE8]'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3 pb-4">
        <Primary3DButton
          id="btn-onboarding-next"
          onClick={handleNext}
          size="lg"
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {currentSlide === slides.length - 1 ? t('btnGetStarted') : t('btnNext')}
        </Primary3DButton>
      </div>
    </div>
  );
};
