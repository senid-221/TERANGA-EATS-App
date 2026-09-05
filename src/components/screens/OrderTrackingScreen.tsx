import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderStatusTimeline } from '../common/OrderStatusTimeline';
import { OrderDeliveryMap } from '../maps/OrderDeliveryMap';
import { DAKAR_NEIGHBORHOODS } from '../../data/constants';
import { ArrowLeft, Clock, MapPin, MessageSquare, Motorbike, Phone } from 'lucide-react';
import { Order } from '../../types';

interface OrderTrackingScreenProps { orderId: string; onBack: () => void; }

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({ orderId, onBack }) => {
  const { t, language, orders, restaurants } = useApp();
  const initialOrder = orders.find(o => o.id === orderId);
  const [order, setOrder] = useState<Order | undefined>(initialOrder);

  useEffect(() => {
    const phone = initialOrder?.customerPhone || initialOrder?.deliveryAddress?.phone || '';
    if (!phone) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch('/api/orders/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, phone }) });
        if (!response.ok) return;
        const result = await response.json();
        if (!cancelled && result?.order?.id === orderId) setOrder(result.order as Order);
      } catch { /* keep last known state */ }
    };
    void refresh();
    const timer = window.setInterval(refresh, order?.orderStatus === 'delivering' || order?.orderStatus === 'driver_arrived' ? 2000 : 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [orderId, initialOrder?.customerPhone, initialOrder?.deliveryAddress?.phone, order?.orderStatus]);

  if (!order) return <div className="min-h-screen bg-[#FDFBF7] p-8 text-center"><p className="font-bold">Commande introuvable</p><button onClick={onBack} className="mt-4 px-4 py-2 bg-[#046A38] text-white rounded-xl">Retour</button></div>;

  const restObj = restaurants.find(r => r.id === order.restaurantId);
  const neighborhood = order.deliveryAddress?.neighborhood || '';
  const matchedNeighborhood = DAKAR_NEIGHBORHOODS.find(n => n.name.toLowerCase() === neighborhood.toLowerCase() || neighborhood.toLowerCase().includes(n.id));
  const restaurantData = { name: order.restaurantName, latitude: restObj?.latitude || 14.6708, longitude: restObj?.longitude || -17.4381, address: order.restaurantAddress, logoUrl: order.restaurantLogo };
  const deliveryData = { neighborhood, street: order.deliveryAddress.streetAddress, latitude: order.deliveryAddress.lat ?? matchedNeighborhood?.lat ?? 14.7118, longitude: order.deliveryAddress.lng ?? matchedNeighborhood?.lng ?? -17.4699 };
  const hasLiveGps = Number.isFinite(order.driver?.currentLat) && Number.isFinite(order.driver?.currentLng) && Boolean(order.driver?.lastLocationAt);
  const handleCallDriver = () => { if (order.driver?.phone) window.location.href = `tel:${order.driver.phone}`; };
  const handleMessageDriver = () => {
    if (!order.driver?.phone) return;
    const text = encodeURIComponent(language === 'fr' ? `Bonjour ${order.driver.name || ''}, je vous contacte au sujet de ma commande ${order.id}.` : `Hello ${order.driver.name || ''}, I am contacting you about my order ${order.id}.`);
    window.open(`https://wa.me/${String(order.driver.phone).replace(/\D/g, '')}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return <div id="order-tracking-screen" className="min-h-screen bg-[#FDFBF7] pb-28 max-w-3xl mx-auto space-y-4">
    <div className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md p-4 sm:p-5 border-b border-[#F0EDE8] flex items-center justify-between"><button onClick={onBack} className="w-11 h-11 rounded-2xl bg-white text-[#2D2D2D] flex items-center justify-center shadow-artistic border border-[#F0EDE8]"><ArrowLeft className="w-5 h-5" /></button><div className="text-center"><h2 className="font-heading font-black text-base sm:text-lg text-[#2D2D2D]">{t('trackingTitle')}</h2><p className="text-[11px] font-black text-[#006633]">{order.id}</p></div><div className="w-11 flex justify-end"><span className={`w-3 h-3 rounded-full ${order.orderStatus === 'delivered' ? 'bg-gray-400' : 'bg-emerald-500 animate-ping'}`} /></div></div>
    <div className="px-4 sm:px-6"><OrderDeliveryMap restaurant={restaurantData} deliveryAddress={deliveryData} driver={order.driver} estimatedTime={order.estimatedDeliveryTime} /></div>
    <div className="px-4 sm:px-6"><div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic"><div className="flex items-center justify-between mb-4"><div><span className="text-xs font-bold text-[#006633] uppercase tracking-wider">{t('estimatedArrival')}</span><h3 className="font-heading font-black text-xl text-[#2D2D2D]">{order.estimatedDeliveryTime}</h3></div><span className="px-3 py-1 rounded-full bg-emerald-50 text-[#006633] text-xs font-black border border-emerald-200 uppercase">{order.orderStatus}</span></div>{order.driver && (order.orderStatus === 'delivering' || order.orderStatus === 'driver_arrived') && <div className={`mb-4 p-3.5 rounded-2xl border flex items-center gap-2 ${hasLiveGps ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}><MapPin className="w-5 h-5" /><div><p className="text-xs font-black">{hasLiveGps ? (language === 'fr' ? 'GPS du livreur en direct' : 'Driver GPS is live') : (language === 'fr' ? 'GPS du livreur en attente…' : 'Waiting for driver GPS…')}</p><p className="text-[10px] font-medium opacity-75">{hasLiveGps ? (language === 'fr' ? 'La position est actualisée automatiquement.' : 'Location updates automatically.') : (language === 'fr' ? 'Le livreur doit activer son GPS.' : 'The driver must enable GPS.')}</p></div></div>}{order.orderStatus === 'driver_arrived' && <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between gap-2 animate-pulse"><div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-600" /><p className="text-xs font-black">{language === 'fr' ? 'Le livreur est arrivé à votre adresse.' : 'The courier has arrived at your address.'}</p></div>{order.driver?.phone && <button onClick={handleCallDriver} className="px-3 py-1 bg-amber-400 text-slate-900 font-black text-xs rounded-xl">Appeler</button>}</div>}<OrderStatusTimeline currentStatus={order.orderStatus} /><p className="mt-4 text-[10px] text-gray-400 font-medium">{language === 'fr' ? 'Statut toutes les 5 s. GPS toutes les 2 s. pendant la livraison.' : 'Status every 5s. GPS every 2s. during delivery.'}</p></div></div>
    {order.driver && <div className="px-4 sm:px-6"><div className="bg-white rounded-[32px] p-5 border border-[#F0EDE8] shadow-artistic flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0">{order.driver.photoUrl ? <img src={order.driver.photoUrl} alt={order.driver.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-[#006633]"><Motorbike className="w-6 h-6" /></div>}</div><div><div className="flex items-center gap-1.5"><h4 className="font-bold text-sm">{order.driver.name}</h4><span className="text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded-md">★ {order.driver.rating}</span></div><p className="text-xs text-gray-500 mt-0.5">{order.driver.vehicleType} • {order.driver.vehiclePlate}</p><p className="text-[10px] text-[#006633] font-bold">Livreur vérifié Teranga</p></div></div><div className="flex items-center gap-2"><button onClick={handleMessageDriver} disabled={!order.driver.phone} className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#006633] flex items-center justify-center border border-emerald-200 disabled:opacity-40" aria-label="WhatsApp driver"><MessageSquare className="w-5 h-5" /></button>{order.driver.phone && <button onClick={handleCallDriver} className="w-11 h-11 rounded-2xl bg-[#006633] text-white flex items-center justify-center"><Phone className="w-5 h-5" /></button>}</div></div></div>}
    <div className="px-4 sm:px-6"><div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-3"><div className="flex justify-between items-center pb-3 border-b border-[#F0EDE8]"><h4 className="font-bold text-sm">{t('orderSummary')}</h4><span className="text-xs font-black text-[#006633]">{Number(order.total || 0).toLocaleString()} FCFA</span></div><div className="space-y-2 text-xs text-gray-700">{order.items.map(item => <div key={item.id} className="flex justify-between"><span>{item.quantity}x {language === 'fr' ? item.product.nameFR : item.product.nameEN}</span><span className="font-bold">{Number(item.totalPrice || 0).toLocaleString()} FCFA</span></div>)}</div><div className="pt-3 border-t border-[#F0EDE8] text-xs text-gray-500 space-y-1.5"><div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#006633]" /><span>{neighborhood} — {order.deliveryAddress.streetAddress}</span></div><div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#006633]" /><span>{order.deliveryAddress.phone}</span></div></div></div></div>
  </div>;
};
