import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderStatusTimeline } from '../common/OrderStatusTimeline';
import { Primary3DButton } from '../common/Primary3DButton';
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
  const { t, language, orders, updateOrderStatus, showToast } = useApp();
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

      {/* Dakar Live Interactive Simulated Map Card */}
      <div className="px-4 sm:px-6">
        <div className="relative h-64 sm:h-72 w-full rounded-[36px] overflow-hidden shadow-artistic-lg border border-[#F0EDE8] bg-slate-900">
          {/* Map Vector Dakar Coastline / Grid */}
          <svg className="w-full h-full object-cover" viewBox="0 0 600 350" preserveAspectRatio="none">
            {/* Sea background */}
            <rect width="600" height="350" fill="#0A1E2C" />
            {/* Dakar Peninsula Land Shape */}
            <path
              d="M 50,0 Q 200,80 350,40 T 550,120 L 600,350 L 100,350 Q 80,240 50,150 Z"
              fill="#0E331E"
              opacity="0.95"
            />
            {/* Road Networks (Corniche Ouest, VDN, Autoroute) */}
            <path
              d="M 120,40 Q 250,100 380,180 T 500,300"
              stroke="#FFCC00"
              strokeWidth="4"
              fill="none"
              strokeDasharray="6,4"
              opacity="0.85"
            />
            <path
              d="M 220,20 Q 300,120 420,220"
              stroke="#006633"
              strokeWidth="3"
              fill="none"
              opacity="0.6"
            />
          </svg>

          {/* Restaurant Marker */}
          <div className="absolute top-12 left-16 flex flex-col items-center">
            <div className="w-9 h-9 rounded-2xl bg-[#FFCC00] text-amber-950 flex items-center justify-center shadow-lg font-black text-xs ring-4 ring-[#FFCC00]/40">
              <Utensils className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-white bg-black/70 px-2 py-0.5 rounded-md mt-1 backdrop-blur-xs">
              {order.restaurantName}
            </span>
          </div>

          {/* Moving Driver Scooter Marker */}
          <motion.div
            className="absolute flex flex-col items-center z-10"
            style={{
              top: `${25 + driverProgress * 0.45}%`,
              left: `${20 + driverProgress * 0.55}%`,
            }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[#006633] text-[#FFCC00] flex items-center justify-center shadow-2xl ring-4 ring-white border-2 border-[#FFCC00]">
                <Motorbike className="w-6 h-6" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#E8702A] animate-ping" />
            </div>
            <span className="text-[10px] font-black text-white bg-[#006633] px-2.5 py-0.5 rounded-full mt-1 shadow-md">
              Amadou (Livreur)
            </span>
          </motion.div>

          {/* Customer Destination Marker */}
          <div className="absolute bottom-10 right-14 flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg ring-4 ring-red-300/50 animate-bounce">
              <MapPin className="w-5 h-5 fill-white text-red-600" />
            </div>
            <span className="text-[10px] font-extrabold text-white bg-black/70 px-2 py-0.5 rounded-md mt-1 backdrop-blur-xs">
              {order.deliveryAddress.neighborhood}
            </span>
          </div>

          {/* Map Overlay Stats */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md rounded-2xl p-2.5 px-3 text-white text-xs space-y-0.5 border border-white/10">
            <div className="flex items-center gap-1.5 font-black text-[#FFCC00]">
              <Clock className="w-3.5 h-3.5" />
              <span>{order.estimatedDeliveryTime}</span>
            </div>
            <p className="text-[10px] text-gray-300">Corniche Ouest Dakar</p>
          </div>
        </div>
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
