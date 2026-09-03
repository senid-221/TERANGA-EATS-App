import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderStatusTimeline } from '../common/OrderStatusTimeline';
import { Primary3DButton } from '../common/Primary3DButton';
import { OrderDeliveryMap } from '../maps/OrderDeliveryMap';
import { DAKAR_NEIGHBORHOODS } from '../../data/constants';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Motorbike,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Utensils,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderStatus } from '../../types';

interface OrderTrackingScreenProps {
  orderId: string;
  onBack: () => void;
}

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  orderId,
  onBack,
}) => {
  const { t, language, orders, restaurants, updateOrderStatus, showToast } = useApp();
  const order = orders.find((o) => o.id === orderId) || orders[0];

  const [showChatModal, setShowChatModal] = useState(false);
  const [messages, setMessages] = useState<{ id: string; sender: 'driver' | 'user'; text: string; time: string }[]>([
    { id: '1', sender: 'driver', text: 'Salam Alaykoum ! J\'ai récupéré votre commande au restaurant, je suis en route vers vous sur la Corniche.', time: '12:32' },
  ]);
  const [inputText, setInputText] = useState('');

  // Simulated live driver movement position (0 to 100%)
  const [driverProgress, setDriverProgress] = useState(65);

  useEffect(() => {
    const interval = setInterval(() => {
      setDriverProgress((prev) => (prev >= 95 ? 20 : prev + 5));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p>Commande introuvable</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-[#046A38] text-white rounded-xl">
          Retour
        </button>
      </div>
    );
  }

  // Look up coordinates
  const restObj = restaurants.find((r) => r.id === order.restaurantId);
  const matchedNeighborhood = DAKAR_NEIGHBORHOODS.find(
    (n) => n.name.toLowerCase() === order.deliveryAddress.neighborhood.toLowerCase() ||
           order.deliveryAddress.neighborhood.toLowerCase().includes(n.id)
  );

  const restaurantData = {
    name: order.restaurantName,
    latitude: restObj?.latitude || 14.6708,
    longitude: restObj?.longitude || -17.4381,
    address: order.restaurantAddress,
    logoUrl: order.restaurantLogo,
  };

  const deliveryData = {
    neighborhood: order.deliveryAddress.neighborhood,
    street: order.deliveryAddress.streetAddress,
    latitude: order.deliveryAddress.lat || matchedNeighborhood?.lat || 14.7118,
    longitude: order.deliveryAddress.lng || matchedNeighborhood?.lng || -17.4699,
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: String(Date.now()),
      sender: 'user' as const,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Driver auto-reply after 1.5s
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'driver',
          text: 'Bien reçu ! J\'arrive dans 5 minutes environ incha\'Allah.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  const handleCallDriver = () => {
    showToast(language === 'fr' ? 'Appel du livreur Amadou (+221 77 456 78 90)...' : 'Calling driver Amadou (+221 77 456 78 90)...');
  };

  // Status simulation control for testing
  const handleSimulateStatus = (nextStatus: OrderStatus) => {
    updateOrderStatus(order.id, nextStatus);
    showToast(`Statut mis à jour : ${nextStatus}`);
  };

  return (
    <div id="order-tracking-screen" className="min-h-screen bg-[#FDFBF7] pb-28 max-w-3xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md p-4 sm:p-5 border-b border-[#F0EDE8] flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-white text-[#2D2D2D] flex items-center justify-center shadow-artistic border border-[#F0EDE8] hover:bg-gray-50 cursor-pointer active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="font-heading font-black text-base sm:text-lg text-[#2D2D2D]">
            {t('trackingTitle')}
          </h2>
          <p className="text-[11px] font-black text-[#006633]">{order.id}</p>
        </div>

        <div className="w-11 flex justify-end items-center">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      {/* Dakar Live Interactive Google Map */}
      <div className="px-4 sm:px-6">
        <OrderDeliveryMap
          restaurant={restaurantData}
          deliveryAddress={deliveryData}
          driver={order.driver}
          estimatedTime={order.estimatedDeliveryTime}
          progressPercent={driverProgress}
        />
      </div>

      {/* 5-Step Order Progress Timeline */}
      <div className="px-4 sm:px-6">
        <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold text-[#006633] uppercase tracking-wider">
                {t('estimatedArrival')}
              </span>
              <h3 className="font-heading font-black text-xl text-[#2D2D2D]">
                {order.estimatedDeliveryTime}
              </h3>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-[#006633] text-xs font-black border border-emerald-200 uppercase tracking-wider">
              {order.orderStatus === 'driver_arrived'
                ? 'Livreur Arrivé 📍'
                : order.orderStatus === 'delivering'
                ? 'En livraison 🛵'
                : order.orderStatus === 'delivered'
                ? 'Livrée 🇸🇳'
                : 'En préparation 🍲'}
            </span>
          </div>

          {order.orderStatus === 'driver_arrived' && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-center justify-between gap-2 shadow-xs animate-pulse">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs font-black">
                  {language === 'fr'
                    ? 'Le livreur est arrivé en bas de votre immeuble !'
                    : 'The courier has arrived downstairs at your address!'}
                </p>
              </div>
              <button
                onClick={handleCallDriver}
                className="px-3 py-1 bg-amber-400 text-slate-900 font-black text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
              >
                Appeler
              </button>
            </div>
          )}

          <OrderStatusTimeline currentStatus={order.orderStatus} />

          {/* Demo Admin State Controls */}
          <div className="pt-3 mt-3 border-t border-[#F0EDE8] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-gray-500 shrink-0">Simuler statut :</span>
            {(['accepted', 'preparing', 'ready', 'delivering', 'driver_arrived', 'delivered'] as OrderStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => handleSimulateStatus(st)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-colors ${
                  order.orderStatus === st
                    ? 'bg-[#006633] text-white shadow-xs'
                    : 'bg-[#F7F5F0] text-gray-700 hover:bg-[#F0EDE8] border border-[#F0EDE8]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Driver Card & Contact */}
      {order.driver && (
        <div className="px-4 sm:px-6">
          <div className="bg-white rounded-[32px] p-5 border border-[#F0EDE8] shadow-artistic flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0 ring-1 ring-gray-200">
                <img
                  src={order.driver.photoUrl}
                  alt={order.driver.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-[#2D2D2D]">{order.driver.name}</h4>
                  <span className="text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded-md">
                    ★ {order.driver.rating}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{order.driver.vehicleType} • {order.driver.vehiclePlate}</p>
                <p className="text-[10px] text-[#006633] font-bold">Livreur vérifié Teranga</p>
              </div>
            </div>

            {/* Actions: Call & In-App Chat */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowChatModal(true)}
                className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#006633] flex items-center justify-center hover:bg-emerald-100 cursor-pointer transition-colors border border-emerald-200/60 shadow-xs active:scale-95"
                title="Message"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <button
                onClick={handleCallDriver}
                className="w-11 h-11 rounded-2xl bg-[#006633] text-white flex items-center justify-center hover:bg-[#004D26] cursor-pointer transition-colors shadow-xs active:scale-95"
                title="Appeler"
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Accordion */}
      <div className="px-4 sm:px-6">
        <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-[#F0EDE8]">
            <h4 className="font-bold text-sm text-[#2D2D2D]">{t('orderSummary')}</h4>
            <span className="text-xs font-black text-[#006633]">
              {order.total.toLocaleString()} FCFA
            </span>
          </div>

          <div className="space-y-2 text-xs text-gray-700">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="font-medium text-[#2D2D2D]">
                  {item.quantity}x {language === 'fr' ? item.product.nameFR : item.product.nameEN}
                </span>
                <span className="font-bold text-[#2D2D2D]">{item.totalPrice.toLocaleString()} FCFA</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#F0EDE8] text-xs text-gray-500 space-y-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#006633]" />
              <span>{order.deliveryAddress.neighborhood} — {order.deliveryAddress.streetAddress}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#006633]" />
              <span>{order.deliveryAddress.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* In-App Live Driver Chat Modal */}
      <AnimatePresence>
        {showChatModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[36px] sm:rounded-[36px] shadow-2xl h-[75vh] flex flex-col overflow-hidden border border-[#F0EDE8]"
            >
              {/* Chat Header */}
              <div className="p-4 bg-[#006633] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white ring-2 ring-white/20">
                    <img
                      src={order.driver?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'}
                      alt="Driver"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{order.driver?.fullName || 'Amadou Diallo'}</h3>
                    <p className="text-[11px] text-emerald-200">En route • Moto Yamaha</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowChatModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FDFBF7]">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-medium ${
                        m.sender === 'user'
                          ? 'bg-[#006633] text-white rounded-br-none shadow-xs'
                          : 'bg-white text-[#2D2D2D] border border-[#F0EDE8] rounded-bl-none shadow-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">{m.time}</span>
                  </div>
                ))}
              </div>

              {/* Quick Preset Phrases */}
              <div className="p-2.5 bg-[#F7F5F0] border-t border-[#F0EDE8] flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  "J'arrive en bas",
                  "Laissez à la porte svp",
                  "Appelez-moi à l'arrivée",
                  "Merci !",
                ].map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(phrase)}
                    className="px-3 py-1 rounded-full bg-white border border-[#F0EDE8] text-gray-700 text-[11px] font-bold hover:bg-[#F0EDE8] whitespace-nowrap cursor-pointer"
                  >
                    {phrase}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#F0EDE8] flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Écrivez un message au livreur..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[#F7F5F0] text-xs text-[#2D2D2D] font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#006633]"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-2xl bg-[#006633] text-white hover:bg-[#004D26] cursor-pointer shadow-xs active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
