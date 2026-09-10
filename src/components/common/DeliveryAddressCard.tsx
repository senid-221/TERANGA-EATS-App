import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DAKAR_NEIGHBORHOODS } from '../../data/constants';
import { Building, Check, Locate, MapPin, Phone, User, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface DeliveryAddressCardProps { onAddressChange?: () => void; }

export const DeliveryAddressCard: React.FC<DeliveryAddressCardProps> = () => {
  const { deliveryAddress, setDeliveryAddress, setCurrentNeighborhood, language, t } = useApp();
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const handleSelectNeighborhood = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = DAKAR_NEIGHBORHOODS.find((n) => n.name === e.target.value);
    if (found) {
      setCurrentNeighborhood(found);
      setDeliveryAddress({ ...deliveryAddress, neighborhood: found.name, lat: found.lat, lng: found.lng });
    }
  };

  const handleGpsDetect = () => {
    setGpsError('');
    if (!navigator.geolocation) { setGpsError('Votre navigateur ne prend pas en charge la géolocalisation.'); return; }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDeliveryAddress((prev) => ({ ...prev, lat: coords.latitude, lng: coords.longitude, instructions: prev.instructions || 'Position GPS exacte transmise au vendeur.' }));
        setIsDetectingGps(false); setGpsSuccess(true); window.setTimeout(() => setGpsSuccess(false), 3500);
      },
      (error) => {
        setIsDetectingGps(false);
        setGpsError(error.code === error.PERMISSION_DENIED ? 'Autorisez la localisation pour utiliser le GPS.' : 'Impossible de récupérer votre position. Vérifiez le GPS et réessayez.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  return (
    <div className="bg-white rounded-[32px] p-6 border border-[#F0EDE8] shadow-artistic space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5"><div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006633] flex items-center justify-center font-bold shadow-xs"><Sparkles className="w-5 h-5" /></div><div><h4 className="font-bold text-sm text-[#2D2D2D]">{language === 'fr' ? 'Quelques questions pour votre commande' : 'A few questions for your order'}</h4><p className="text-xs text-gray-500 font-medium">{language === 'fr' ? 'TerangaEats Assistant — Dakar' : 'TerangaEats Assistant — Dakar'}</p></div></div>
        <button type="button" onClick={handleGpsDetect} disabled={isDetectingGps} className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 text-[#006633] text-xs font-black hover:bg-emerald-100 cursor-pointer border border-emerald-100 transition-all active:scale-95 shadow-xs"><Locate className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin text-[#006633]' : ''}`} /><span>{isDetectingGps ? 'Détection...' : t('useCurrentGPS')}</span></button>
      </div>
      {gpsSuccess && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-[#006633] font-bold flex items-center gap-2"><Check className="w-4 h-4" />Position GPS exacte enregistrée.</motion.div>}
      {gpsError && <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-700 font-bold">{gpsError}</div>}
      <div><label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">{language === 'fr' ? 'Witwa nde ? / Quel est votre nom ?' : 'What is your name?'} *</label><div className="relative"><User className="absolute left-4 top-3 w-3.5 h-3.5 text-gray-400" /><input type="text" value={deliveryAddress.fullName} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, fullName: e.target.value })} placeholder={language === 'fr' ? 'Amazina yawe' : 'Your full name'} className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" /></div></div>
      <div><label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{language === 'fr' ? 'Nimero yawe ya telephone / WhatsApp ?' : 'Your phone / WhatsApp number?'} *</label><input type="tel" value={deliveryAddress.phone} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })} placeholder="+221 77 000 00 00" className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" /></div>
      <div><label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">{language === 'fr' ? 'Email yawe ?' : 'Your email?'} <span className="text-gray-400 font-medium">({language === 'fr' ? 'optionnel' : 'optional'})</span></label><input type="email" value={(deliveryAddress as any).email || ''} onChange={(e) => setDeliveryAddress({ ...(deliveryAddress as any), email: e.target.value })} placeholder="client@email.com" className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" /></div>
      <div><label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">{language === 'fr' ? 'Utuye he? / Où habitez-vous ?' : 'Where do you live?'} *</label><input type="text" value={deliveryAddress.streetAddress} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, streetAddress: e.target.value })} placeholder={language === 'fr' ? 'Rue, numéro, villa ou repère' : 'Street, number, villa or landmark'} className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" /></div>
      <div><label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">{language === 'fr' ? 'Uherereye mu akahe gace ka Dakar ?' : 'Which Dakar area are you in?'} *</label><select value={deliveryAddress.neighborhood} onChange={handleSelectNeighborhood} className="w-full px-4 py-3 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-sm font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none transition-all cursor-pointer">{DAKAR_NEIGHBORHOODS.map((hood) => <option key={hood.id} value={hood.name}>{hood.name} ({hood.zone})</option>)}</select><p className="text-[10px] text-gray-400 mt-1">{language === 'fr' ? 'Choisissez une zone connue de Dakar pour calculer la livraison.' : 'Choose a known Dakar area for delivery.'}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div><label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-gray-400" />{language === 'fr' ? 'Bâtiment / Étage (optionnel)' : 'Building / Floor (optional)'}</label><input type="text" value={deliveryAddress.buildingInfo || ''} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, buildingInfo: e.target.value })} placeholder={t('buildingInfoPlaceholder')} className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" /></div>
        <div><label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">{language === 'fr' ? 'Consigne pour le vendeur (optionnel)' : 'Note for seller (optional)'}</label><input type="text" value={deliveryAddress.instructions || ''} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, instructions: e.target.value })} placeholder={t('deliveryNotesPlaceholder')} className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" /></div>
      </div>
    </div>
  );
};