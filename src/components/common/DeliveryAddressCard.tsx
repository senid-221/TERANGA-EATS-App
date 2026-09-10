import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DAKAR_NEIGHBORHOODS } from '../../data/constants';
import { ArrowRight, Check, Locate, MapPin, MessageCircle, Phone, Send, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface DeliveryAddressCardProps { onAddressChange?: () => void; }

type QuestionKey = 'name' | 'phone' | 'email' | 'street' | 'neighborhood' | 'building' | 'instructions';

const QUESTIONS: Array<{ key: QuestionKey; required?: boolean }> = [
  { key: 'name', required: true },
  { key: 'street', required: true },
  { key: 'phone', required: true },
  { key: 'neighborhood', required: true },
  { key: 'email' },
  { key: 'building' },
  { key: 'instructions' },
];

export const DeliveryAddressCard: React.FC<DeliveryAddressCardProps> = () => {
  const { deliveryAddress, setDeliveryAddress, setCurrentNeighborhood, language, t } = useApp();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const current = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const currentValue = useMemo(() => {
    switch (current.key) {
      case 'name': return deliveryAddress.fullName || '';
      case 'phone': return deliveryAddress.phone || '';
      case 'email': return (deliveryAddress as any).email || '';
      case 'street': return deliveryAddress.streetAddress || '';
      case 'neighborhood': return deliveryAddress.neighborhood || '';
      case 'building': return deliveryAddress.buildingInfo || '';
      case 'instructions': return deliveryAddress.instructions || '';
    }
  }, [current.key, deliveryAddress]);

  const questionText = (key: QuestionKey) => {
    if (language === 'fr') {
      const fr: Record<QuestionKey, string> = {
        name: 'Comment vous appelez-vous ?', phone: 'Quel est votre numéro WhatsApp ?',
        email: 'Votre email ? (optionnel)', street: 'Où devons-nous livrer ?',
        neighborhood: 'Dans quel quartier de Dakar êtes-vous ?', building: 'Un bâtiment ou repère ?',
        instructions: 'Une consigne pour le vendeur ? (optionnel)'
      };
      return fr[key];
    }
    const rw: Record<QuestionKey, string> = {
      name: 'Witwa nde?', phone: 'Nimero yawe ya WhatsApp ni iyihe?',
      email: 'Email yawe? (si ngombwa gusa)', street: 'Tugushyire he?',
      neighborhood: 'Uherereye mu akahe gace ka Dakar?', building: 'Hari bâtiment cyangwa repère?',
      instructions: 'Hari icyo wifuza kubwira seller? (si ngombwa)'
    };
    return rw[key];
  };

  const placeholder = (key: QuestionKey) => {
    if (language === 'fr') {
      const fr: Record<QuestionKey, string> = {
        name: 'Andika amazina yawe', phone: '+221 77 000 00 00', email: 'client@email.com',
        street: 'Rue, villa, numéro ou repère', neighborhood: '', building: 'Ex: Immeuble A, 2e étage',
        instructions: 'Ex: Appelez-moi à votre arrivée'
      };
      return fr[key];
    }
    const rw: Record<QuestionKey, string> = {
      name: 'Andika amazina yawe', phone: '+221 77 000 00 00', email: 'client@email.com',
      street: 'Umuhanda, villa, nimero cyangwa repère', neighborhood: '', building: 'Urugero: Bâtiment A, étage 2',
      instructions: 'Urugero: Munhamagare mugiye kuhagera'
    };
    return rw[key];
  };

  const saveAnswer = (key: QuestionKey, value: string) => {
    const clean = value.trim();
    if (key === 'name') setDeliveryAddress({ ...deliveryAddress, fullName: clean });
    if (key === 'phone') setDeliveryAddress({ ...deliveryAddress, phone: clean });
    if (key === 'email') setDeliveryAddress({ ...(deliveryAddress as any), email: clean });
    if (key === 'street') setDeliveryAddress({ ...deliveryAddress, streetAddress: clean });
    if (key === 'building') setDeliveryAddress({ ...deliveryAddress, buildingInfo: clean });
    if (key === 'instructions') setDeliveryAddress({ ...deliveryAddress, instructions: clean });
  };

  const next = (value = draft) => {
    const clean = value.trim();
    if (current.required && !clean) return;
    if (clean || current.required) saveAnswer(current.key, clean);
    setDraft('');
    if (!isLast) setStep((s) => s + 1);
  };

  const selectNeighborhood = (name: string) => {
    const found = DAKAR_NEIGHBORHOODS.find((n) => n.name === name);
    if (!found) return;
    setCurrentNeighborhood(found);
    setDeliveryAddress({ ...deliveryAddress, neighborhood: found.name, lat: found.lat, lng: found.lng });
    setDraft('');
    if (!isLast) setStep((s) => s + 1);
  };

  const handleGpsDetect = () => {
    setGpsError('');
    if (!navigator.geolocation) { setGpsError(language === 'fr' ? 'La géolocalisation n’est pas disponible.' : 'GPS ntabwo iboneka kuri browser yawe.'); return; }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDeliveryAddress((prev) => ({ ...prev, lat: coords.latitude, lng: coords.longitude, instructions: prev.instructions || 'Position GPS exacte transmise au vendeur.' }));
        setIsDetectingGps(false); setGpsSuccess(true); window.setTimeout(() => setGpsSuccess(false), 3000);
      },
      (error) => {
        setIsDetectingGps(false);
        setGpsError(error.code === error.PERMISSION_DENIED
          ? (language === 'fr' ? 'Autorisez la localisation pour utiliser le GPS.' : 'Emera GPS location kugira dukoreshe aho uherereye.')
          : (language === 'fr' ? 'Impossible de récupérer votre position.' : 'Ntibyashobotse kubona aho uherereye.'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const inputValue = draft || currentValue;

  return (
    <section className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#006633] flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h4 className="font-heading font-black text-sm text-[#2D2D2D]">TerangaEats AI Assistant</h4>
            <p className="text-[11px] text-gray-500 font-medium">{language === 'fr' ? 'Une question à la fois' : 'Ikibazo kimwe icyarimwe'}</p>
          </div>
        </div>
        <span className="text-[10px] font-black text-[#006633] bg-emerald-50 px-3 py-1.5 rounded-full whitespace-nowrap">{step + 1} / {QUESTIONS.length}</span>
      </div>

      <div className="h-1.5 bg-[#F2EFE9] rounded-full overflow-hidden">
        <motion.div className="h-full bg-[#006633] rounded-full" animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} transition={{ duration: 0.25 }} />
      </div>

      <div className="space-y-3">
        <motion.div key={`q-${step}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#006633] text-white flex items-center justify-center shrink-0"><MessageCircle className="w-4 h-4" /></div>
          <div className="max-w-[88%] bg-[#F7F5F0] rounded-2xl rounded-tl-md px-4 py-3">
            <p className="text-sm font-bold text-[#2D2D2D]">{questionText(current.key)}{current.required ? ' *' : ''}</p>
          </div>
        </motion.div>

        {currentValue && !draft && (
          <div className="flex justify-end">
            <div className="max-w-[85%] bg-[#006633] text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-sm font-bold">{currentValue}</div>
          </div>
        )}
      </div>

      {current.key === 'neighborhood' ? (
        <motion.div key="neighborhood" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <select value={deliveryAddress.neighborhood || ''} onChange={(e) => selectNeighborhood(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-sm font-bold text-[#2D2D2D] outline-none focus:bg-white focus:border-[#006633]">
            <option value="">{language === 'fr' ? 'Choisissez votre quartier' : 'Hitamo agace urimo'}</option>
            {DAKAR_NEIGHBORHOODS.map((hood) => <option key={hood.id} value={hood.name}>{hood.name} ({hood.zone})</option>)}
          </select>
          <p className="text-[10px] text-gray-400">{language === 'fr' ? 'Je garde votre réponse pour préparer le message au vendeur.' : 'Igisubizo cyawe kirabikwa kandi kizajya muri message ya seller.'}</p>
        </motion.div>
      ) : (
        <motion.div key={`input-${step}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
          <div className="relative flex-1">
            {current.key === 'phone' ? <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" /> : current.key === 'street' ? <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" /> : null}
            <input
              autoFocus
              type={current.key === 'email' ? 'email' : current.key === 'phone' ? 'tel' : 'text'}
              value={draft || currentValue}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') next(); }}
              placeholder={placeholder(current.key)}
              className={`w-full ${current.key === 'phone' || current.key === 'street' ? 'pl-11' : 'px-4'} pr-4 py-3.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-sm font-bold text-[#2D2D2D] outline-none focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633]`}
            />
          </div>
          <button type="button" onClick={() => next()} disabled={current.required && !inputValue.trim()} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#006633] text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"><Send className="w-4 h-4" /></button>
        </motion.div>
      )}

      {current.key === 'street' && (
        <button type="button" onClick={handleGpsDetect} disabled={isDetectingGps} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 text-[#006633] text-sm font-black border border-emerald-100 active:scale-[.99] transition-all"><Locate className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : ''}`} />{isDetectingGps ? (language === 'fr' ? 'Localisation…' : 'Ndimo kubona location…') : t('useCurrentGPS')}</button>
      )}

      {!current.required && current.key !== 'neighborhood' && (
        <button type="button" onClick={() => next('')} className="text-xs font-bold text-gray-400 hover:text-[#006633] transition-colors">{language === 'fr' ? 'Passer cette question' : 'Simbuka iki kibazo'}</button>
      )}

      {gpsSuccess && <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-[#006633] font-bold flex items-center gap-2"><Check className="w-4 h-4" />{language === 'fr' ? 'Position GPS exacte enregistrée.' : 'GPS location yabitswe neza.'}</div>}
      {gpsError && <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-700 font-bold">{gpsError}</div>}

      {isLast && currentValue && <div className="flex items-center gap-2 text-xs font-bold text-[#006633] bg-emerald-50 rounded-2xl px-4 py-3"><Check className="w-4 h-4" />{language === 'fr' ? 'Toutes les réponses sont prêtes pour WhatsApp.' : 'Ibisubizo byose byiteguye kujya muri message ya WhatsApp.'}</div>}

      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium"><ArrowRight className="w-3.5 h-3.5 text-[#006633]" />{language === 'fr' ? 'Je mémorise chaque réponse avant de passer à la suivante.' : 'Buri gisubizo ndakibika mbere yo kubaza ikindi kibazo.'}</div>
    </section>
  );
};