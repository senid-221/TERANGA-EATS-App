import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, Send, Sparkles, X } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

const WHATSAPP_NUMBER = '250726969060';
const WHATSAPP_FORMATTED = '+250 726 969 060';

export const WhatsAppFloating: React.FC = () => {
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const quickPrompts = language === 'fr' ? [
    { label: '🥘 Commander un plat', text: 'Bonjour Teranga Eats, je souhaite commander un plat savoureux !' },
    { label: '🪑 Réserver une table', text: 'Bonjour Teranga Eats, je souhaite réserver une table dans un restaurant.' },
    { label: '🛵 Suivi de commande', text: 'Bonjour Teranga Eats, je souhaite avoir des informations sur ma livraison.' },
    { label: '💬 Autre question', text: 'Bonjour Teranga Eats, j’ai une question.' },
  ] : [
    { label: '🥘 Order Food', text: 'Hello Teranga Eats, I would like to place a food order!' },
    { label: '🪑 Book a Table', text: 'Hello Teranga Eats, I would like to reserve a table at a restaurant.' },
    { label: '🛵 Order Tracking', text: 'Hello Teranga Eats, I would like an update on my delivery.' },
    { label: '💬 General Query', text: 'Hello Teranga Eats, I have a question.' },
  ];
  const handleOpenWhatsApp = (customText?: string) => {
    const textToSend = customText || customMsg || (language === 'fr' ? 'Bonjour Teranga Eats, j’aimerais obtenir des informations !' : 'Hello Teranga Eats, I would like some information!');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(textToSend)}`, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };
  return <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end">
    <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0, y: 15, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.92 }} transition={{ type: 'spring', damping: 25, stiffness: 350 }} className="mb-3 w-[310px] sm:w-[340px] bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-[#EAE2D5] overflow-hidden">
      <div className="bg-gradient-to-r from-[#006633] via-[#075E54] to-[#128C7E] p-4 text-white"><div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><div className="relative"><div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md"><WhatsAppIcon className="w-5 h-5 fill-white" /></div><span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" /></div><div><h4 className="font-heading font-black text-sm text-white tracking-wide flex items-center gap-1.5"><span>Teranga Support</span><span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">24/7</span></h4><p className="text-[11px] text-emerald-100 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /><span>Dakar : {WHATSAPP_FORMATTED}</span></p></div></div><button type="button" onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white" aria-label="Fermer"><X className="w-4 h-4" /></button></div></div>
      <div className="p-4 bg-[#FAF7F2] space-y-3"><div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-[#EAE2D5] shadow-xs text-xs text-gray-700 space-y-1"><p className="font-bold text-[#006633] flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#FFCC00] fill-[#FFCC00]" /><span>{language === 'fr' ? 'Nangadef ! 👋' : 'Welcome! 👋'}</span></p><p className="leading-relaxed">{language === 'fr' ? 'Besoin d’aide pour une commande, un plat local ou une réservation ? Écrivez-nous directement sur WhatsApp.' : 'Need help with an order, local dishes, or table booking? Chat with us directly on WhatsApp.'}</p></div><div className="space-y-1.5"><p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'fr' ? 'Sujets rapides' : 'Quick Actions'}</p><div className="grid grid-cols-1 gap-1.5">{quickPrompts.map((item, idx) => <button key={idx} type="button" onClick={() => handleOpenWhatsApp(item.text)} className="text-left text-xs font-semibold px-3 py-2 rounded-xl bg-white hover:bg-[#F0EDE8] border border-[#EAE2D5] text-[#2D2D2D] flex items-center justify-between group transition-all cursor-pointer active:scale-98 shadow-2xs"><span className="truncate">{item.label}</span><Send className="w-3 h-3 text-gray-400 group-hover:text-[#006633] group-hover:translate-x-0.5 transition-all" /></button>)}</div></div><div className="pt-1"><div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 pl-3 border border-[#EAE2D5] focus-within:border-[#25D366] focus-within:ring-2 focus-within:ring-emerald-100 transition-all"><input type="text" value={customMsg} onChange={e => setCustomMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleOpenWhatsApp(); }} placeholder={language === 'fr' ? 'Écrivez votre message...' : 'Type your message...'} className="w-full text-xs text-[#2D2D2D] bg-transparent outline-hidden placeholder:text-gray-400" /><button type="button" onClick={() => handleOpenWhatsApp()} className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center hover:bg-[#20bd5a] transition-all cursor-pointer shrink-0 shadow-xs active:scale-95" aria-label="Envoyer"><Send className="w-3.5 h-3.5" /></button></div></div><button type="button" onClick={() => handleOpenWhatsApp()} className="w-full py-2.5 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"><WhatsAppIcon className="w-4 h-4 fill-white" /><span>{language === 'fr' ? `Ouvrir WhatsApp (${WHATSAPP_FORMATTED})` : `Open WhatsApp (${WHATSAPP_FORMATTED})`}</span><ExternalLink className="w-3 h-3 text-white/80" /></button></div>
    </motion.div>}</AnimatePresence>
    <div className="relative group"><span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" /><motion.button id="whatsapp-floating-button" type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} onClick={() => setIsOpen(prev => !prev)} className="relative flex items-center gap-2.5 px-3.5 sm:px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm shadow-[0_8px_25px_rgba(37,211,102,0.5)] border-2 border-white cursor-pointer select-none transition-all hover:shadow-[0_10px_30px_rgba(37,211,102,0.7)]" aria-label="WhatsApp Support +250726969060"><div className="relative flex items-center justify-center"><WhatsAppIcon className="w-5 h-5 sm:w-6 sm:h-6 fill-white drop-shadow-xs" /><span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FFCC00] rounded-full border border-white" /></div><span className="hidden sm:inline-block tracking-wide font-bold">WhatsApp</span><span className="sm:hidden text-[11px] font-bold">WhatsApp</span></motion.button></div>
  </div>;
};
