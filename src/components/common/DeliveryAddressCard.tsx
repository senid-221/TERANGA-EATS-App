import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DAKAR_NEIGHBORHOODS } from '../../data/constants';
import { Building, Check, Locate, MapPin, Phone, User } from 'lucide-react';
import { motion } from 'motion/react';

interface DeliveryAddressCardProps {
  onAddressChange?: () => void;
}

export const DeliveryAddressCard: React.FC<DeliveryAddressCardProps> = () => {
  const { deliveryAddress, setDeliveryAddress, currentNeighborhood, setCurrentNeighborhood, t } = useApp();
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const handleSelectNeighborhood = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = DAKAR_NEIGHBORHOODS.find((n) => n.name === e.target.value);
    if (found) {
      setCurrentNeighborhood(found);
      setDeliveryAddress({
        ...deliveryAddress,
        neighborhood: found.name,
        lat: found.lat,
        lng: found.lng,
      });
    }
  };

  const handleGpsDetect = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Votre navigateur ne prend pas en charge la géolocalisation.');
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDeliveryAddress((prev) => ({
          ...prev,
          lat: coords.latitude,
          lng: coords.longitude,
          instructions: prev.instructions || 'Position GPS exacte transmise au livreur.',
        }));
        setIsDetectingGps(false);
        setGpsSuccess(true);
        window.setTimeout(() => setGpsSuccess(false), 3500);
      },
      (error) => {
        setIsDetectingGps(false);
        const message = error.code === error.PERMISSION_DENIED
          ? 'Autorisez la localisation pour utiliser le GPS.'
          : 'Impossible de récupérer votre position. Vérifiez le GPS et réessayez.';
        setGpsError(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  return (
    <div className="bg-white rounded-[32px] p-6 border border-[#F0EDE8] shadow-artistic space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006633] flex items-center justify-center font-bold shadow-xs">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#2D2D2D]">{t('stepAddress')}</h4>
            <p className="text-xs text-gray-500 font-medium">Dakar et banlieue proche</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGpsDetect}
          disabled={isDetectingGps}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 text-[#006633] text-xs font-black hover:bg-emerald-100 cursor-pointer border border-emerald-100 transition-all active:scale-95 shadow-xs"
        >
          <Locate className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin text-[#006633]' : ''}`} />
          <span>{isDetectingGps ? 'Détection...' : t('useCurrentGPS')}</span>
        </button>
      </div>

      {gpsSuccess && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-[#006633] font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          Position GPS exacte enregistrée pour la livraison.
        </motion.div>
      )}

      {gpsError && (
        <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-700 font-bold">
          {gpsError}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">{t('deliveryLocationSelect')} *</label>
        <select value={deliveryAddress.neighborhood} onChange={handleSelectNeighborhood} className="w-full px-4 py-3 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-sm font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none transition-all cursor-pointer">
          {DAKAR_NEIGHBORHOODS.map((hood) => (
            <option key={hood.id} value={hood.name}>{hood.name} ({hood.zone}) — {hood.deliveryFee} FCFA ({hood.deliveryTimeEstimate})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-gray-400" />{t('fullName')} *</label>
          <input type="text" value={deliveryAddress.fullName} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, fullName: e.target.value })} placeholder="Nom complet" className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />WhatsApp / {t('phone')} *</label>
          <input type="tel" value={deliveryAddress.phone} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })} placeholder="+221 77 000 00 00" className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">Email (Optionnel)</label>
        <input type="email" value={(deliveryAddress as any).email || ''} onChange={(e) => setDeliveryAddress({ ...(deliveryAddress as any), email: e.target.value })} placeholder="client@email.com" className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" />
      </div>

      <div>
        <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" />Rue, N° Villa ou Repère Dakar *</label>
        <input type="text" value={deliveryAddress.streetAddress} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, streetAddress: e.target.value })} placeholder={t('streetAddressPlaceholder')} className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-gray-400" />Bâtiment / Étage (Optionnel)</label>
          <input type="text" value={deliveryAddress.buildingInfo || ''} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, buildingInfo: e.target.value })} placeholder={t('buildingInfoPlaceholder')} className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">Consigne Livreur</label>
          <input type="text" value={deliveryAddress.instructions || ''} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, instructions: e.target.value })} placeholder={t('deliveryNotesPlaceholder')} className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none" />
        </div>
      </div>
    </div>
  );
};
