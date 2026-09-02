import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Motorbike,
  Navigation,
  Phone,
  Power,
  ShieldCheck,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { motion } from 'motion/react';
import { OrderStatus } from '../../types';

export const DriverDashboardScreen: React.FC = () => {
  const { t, language, orders, updateOrderStatus, switchRole, showToast } = useApp();
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'earnings'>('available');

  const activeMission = orders.find(
    (o) =>
      o.orderStatus === 'delivering' ||
      o.orderStatus === 'driver_arrived' ||
      o.orderStatus === 'ready' ||
      o.orderStatus === 'picked_up' ||
      o.orderStatus === 'preparing' ||
      o.orderStatus === 'accepted'
  );

  const handleUpdateMission = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    if (status === 'delivered') {
      showToast('🎉 Course terminée ! +1 500 FCFA crédités sur votre compte Wave.');
    } else if (status === 'driver_arrived') {
      showToast('📍 Notification envoyée au client : Vous êtes arrivé en bas de son adresse !');
    } else {
      showToast(`Statut course mis à jour : ${status}`);
    }
  };

  const handleCashoutWave = () => {
    showToast('Transfert Wave de 24 500 FCFA initié vers votre numéro +221 77 456 78 90 !');
  };

  return (
    <div id="driver-dashboard" className="p-4 sm:p-6 pb-28 max-w-4xl mx-auto space-y-6">
      {/* Driver Status Header */}
      <div className="bg-gradient-to-r from-[#006633] via-[#085C2E] to-[#1F2937] text-white rounded-[32px] p-6 sm:p-8 shadow-artistic-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-700/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center font-bold text-2xl shadow-xs border border-white/20">
            🛵
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <button
                onClick={() => switchRole('customer')}
                className="px-3 py-0.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Mode Client</span>
              </button>
              <span className="px-3 py-0.5 rounded-full bg-white/20 text-[#FFCC00] text-xs font-black uppercase tracking-wider">
                Livreur Pro
              </span>
              <span className="text-xs text-white/80 font-medium">Amadou Diallo • Moto Yamaha</span>
            </div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
              {t('driverDashboardTitle')}
            </h2>
          </div>
        </div>

        {/* Online Toggle */}
        <button
          onClick={() => {
            setIsOnline(!isOnline);
            showToast(isOnline ? 'Vous êtes maintenant hors ligne' : 'Vous êtes en ligne et prêt à recevoir des courses à Dakar');
          }}
          className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 cursor-pointer shadow-artistic transition-all active:scale-95 ${
            isOnline
              ? 'bg-[#FFCC00] text-[#2D2D2D] hover:bg-yellow-400'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isOnline ? 'En ligne (Disponible)' : 'Hors ligne'}</span>
        </button>
      </div>

      {/* Earnings Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic">
          <span className="text-xs font-bold text-gray-500">Gains aujourd'hui</span>
          <p className="font-heading font-black text-xl text-[#2D2D2D] mt-1">24 500 FCFA</p>
          <button
            onClick={handleCashoutWave}
            className="text-[11px] font-black text-[#007CB0] hover:underline cursor-pointer mt-1 block"
          >
            Retrait Wave instantané →
          </button>
        </div>

        <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic">
          <span className="text-xs font-bold text-gray-500">Courses livrées</span>
          <p className="font-heading font-black text-xl text-[#2D2D2D] mt-1">9 courses</p>
          <p className="text-[11px] text-[#006633] font-black mt-1">100% à l'heure</p>
        </div>

        <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-gray-500">Note client</span>
          <p className="font-heading font-black text-xl text-[#FFCC00] mt-1">★ 4.9 / 5.0</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">128 avis positifs</p>
        </div>
      </div>

      {/* Active Mission Card */}
      {activeMission && (
        <div className="bg-white rounded-[32px] p-6 border-2 border-[#006633] shadow-artistic-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EDE8]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-heading font-black text-base text-[#2D2D2D]">
                Course en cours : {activeMission.id}
              </h3>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-[#006633] text-xs font-black">
              +1 500 FCFA
            </span>
          </div>

          {/* Route Info */}
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3.5 p-3.5 bg-[#F7F5F0] rounded-2xl border border-[#F0EDE8]">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black shrink-0">
                1
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Récupération</span>
                <p className="font-bold text-sm text-[#2D2D2D]">{activeMission.restaurantName}</p>
                <p className="text-gray-500 font-medium">Plateau, Rue Victor Hugo Dakar</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
              <div className="w-8 h-8 rounded-xl bg-[#006633] text-white flex items-center justify-center font-black shrink-0">
                2
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-[#006633] uppercase tracking-wider">Livraison Client</span>
                <p className="font-bold text-sm text-[#2D2D2D]">{activeMission.customerName}</p>
                <p className="text-gray-600 font-medium">
                  {activeMission.deliveryAddress.neighborhood} — {activeMission.deliveryAddress.streetAddress}
                </p>
                <p className="text-[#006633] font-black mt-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {activeMission.deliveryAddress.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button for Next Step */}
          <div className="pt-2">
            {activeMission.orderStatus !== 'delivering' && activeMission.orderStatus !== 'driver_arrived' ? (
              <button
                onClick={() => handleUpdateMission(activeMission.id, 'delivering')}
                className="w-full py-3.5 rounded-2xl bg-[#006633] text-white font-black text-sm hover:bg-[#00552B] cursor-pointer shadow-artistic transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Motorbike className="w-5 h-5" />
                <span>Commande récupérée au restaurant → En route vers le client</span>
              </button>
            ) : activeMission.orderStatus === 'delivering' ? (
              <button
                onClick={() => handleUpdateMission(activeMission.id, 'driver_arrived')}
                className="w-full py-3.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm hover:bg-amber-400 cursor-pointer shadow-artistic transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5 fill-current animate-bounce" />
                <span>Je suis arrivé en bas de l'immeuble ! (Notifier le client) 📍</span>
              </button>
            ) : (
              <button
                onClick={() => handleUpdateMission(activeMission.id, 'delivered')}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 cursor-pointer shadow-artistic transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmer la remise en mains propres au client 🇸🇳</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
