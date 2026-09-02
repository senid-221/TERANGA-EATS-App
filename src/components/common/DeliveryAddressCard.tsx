import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DAKAR_NEIGHBORHOODS } from '../../data/mockData';
import { Building, Check, Locate, MapPin, Phone, User } from 'lucide-react';
import { motion } from 'motion/react';

interface DeliveryAddressCardProps {
  onAddressChange?: () => void;
}

export const DeliveryAddressCard: React.FC<DeliveryAddressCardProps> = () => {
  const { deliveryAddress, setDeliveryAddress, currentNeighborhood, setCurrentNeighborhood, t } = useApp();
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

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
    setIsDetectingGps(true);
    setTimeout(() => {
      setIsDetectingGps(false);
      setGpsSuccess(true);
      // Pick current neighborhood or default to Almadies / Plateau
      setDeliveryAddress((prev) => ({
        ...prev,
        streetAddress: 'Corniche Ouest, Dakar (Position GPS fixée)',
        instructions: 'Coordonnées GPS transmises au livreur',
      }));
      setTimeout(() => setGpsSuccess(false), 3500);
    }, 1200);
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

        {/* GPS Button */}
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
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-[#006633] font-bold flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          {t('gpsDetected')}
        </motion.div>
      )}

      {/* Neighborhood Picker */}
      <div>
        <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">
          {t('deliveryLocationSelect')} *
        </label>
        <select
          value={deliveryAddress.neighborhood}
          onChange={handleSelectNeighborhood}
          className="w-full px-4 py-3 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-sm font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none transition-all cursor-pointer"
        >
          {DAKAR_NEIGHBORHOODS.map((hood) => (
            <option key={hood.id} value={hood.name}>
              {hood.name} ({hood.zone}) — {hood.deliveryFee} FCFA ({hood.deliveryTimeEstimate})
            </option>
          ))}
        </select>
      </div>

      {/* Full Name & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {t('fullName')} *
          </label>
          <input
            type="text"
            value={deliveryAddress.fullName}
            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, fullName: e.target.value })}
            placeholder="Nom complet"
            className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            {t('phone')} (Sénégal) *
          </label>
          <input
            type="tel"
            value={deliveryAddress.phone}
            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
            placeholder="+221 77 000 00 00"
            className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none"
          />
        </div>
      </div>

      {/* Street & Landmark */}
      <div>
        <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          Rue, N° Villa ou Repère Dakar *
        </label>
        <input
          type="text"
          value={deliveryAddress.streetAddress}
          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, streetAddress: e.target.value })}
          placeholder={t('streetAddressPlaceholder')}
          className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none"
        />
      </div>

      {/* Building & Delivery instructions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-gray-400" />
            Bâtiment / Étage (Optionnel)
          </label>
          <input
            type="text"
            value={deliveryAddress.buildingInfo || ''}
            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, buildingInfo: e.target.value })}
            placeholder={t('buildingInfoPlaceholder')}
            className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">
            Consigne Livreur
          </label>
          <input
            type="text"
            value={deliveryAddress.instructions || ''}
            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, instructions: e.target.value })}
            placeholder={t('deliveryNotesPlaceholder')}
            className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:border-[#006633] focus:ring-1 focus:ring-[#006633] outline-none"
          />
        </div>
      </div>
    </div>
  );
};
