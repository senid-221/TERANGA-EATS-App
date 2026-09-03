import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DollarSign, MapPin, RefreshCw, ShoppingBag, Store, Utensils } from 'lucide-react';
import { OrderStatus } from '../../types';

export const AdminDashboardScreen: React.FC = () => {
  const { t, orders, restaurants, bookings, updateOrderStatus, showToast, isSupabaseConnected, syncData } = useApp();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeOrdersCount = orders.filter((o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled').length;
  const visibleOrders = orders.filter((o) => selectedStatusFilter === 'all' || o.orderStatus === selectedStatusFilter);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncData();
    setIsSyncing(false);
    showToast('Données synchronisées avec Supabase !');
  };

  return (
    <div id="admin-dashboard" className="p-4 sm:p-6 pb-28 max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-[#006633] via-[#0A522A] to-[#1F2937] text-white rounded-[32px] p-6 sm:p-8 shadow-artistic-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#FFCC00] text-xs font-black uppercase tracking-wider">👑 Teranga HQ</span>
            <span className="text-xs text-white/80 font-semibold">Admin Control Center</span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white">{t('adminDashboardTitle')}</h2>
          <p className="text-xs sm:text-sm text-white/70 mt-1 font-medium">Supervision en temps réel des commandes, réservations et base de données Supabase</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleManualSync} disabled={isSyncing} className="px-3.5 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-black border border-white/30 flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /><span>Actualiser DB</span></button>
          <span className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30 flex items-center gap-2 shadow-xs"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />{isSupabaseConnected ? 'Supabase Connecté' : 'Mode Base de données'}</span>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-4 border border-[#F0EDE8] shadow-xs flex items-center gap-4 flex-wrap"><div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} /><span className="text-xs font-bold text-gray-700">Supabase DB:</span><span className="text-xs font-black text-[#006633]">{isSupabaseConnected ? 'Tables Supabase Actives (PostgreSQL)' : 'Prêt pour configuration .env'}</span></div></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic"><div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-gray-500">{t('adminTotalSales')}</span><div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#006633] flex items-center justify-center"><DollarSign className="w-4 h-4" /></div></div><p className="font-heading font-black text-xl text-[#2D2D2D]">{totalRevenue.toLocaleString()} FCFA</p><p className="text-[10px] text-[#006633] font-black mt-1">Chiffre d'affaires réel</p></div>
        <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic"><div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-gray-500">{t('adminTotalOrders')}</span><div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center"><ShoppingBag className="w-4 h-4" /></div></div><p className="font-heading font-black text-xl text-[#2D2D2D]">{orders.length} commandes</p><p className="text-[10px] text-amber-700 font-black mt-1">{activeOrdersCount} en cours</p></div>
        <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic"><div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-gray-500">{t('adminActiveRestaurants')}</span><div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#007CB0] flex items-center justify-center"><Store className="w-4 h-4" /></div></div><p className="font-heading font-black text-xl text-[#2D2D2D]">{restaurants.length} partenaires</p><p className="text-[10px] text-sky-700 font-black mt-1">Restaurants actifs</p></div>
        <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic"><div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-gray-500">Réservations Tables</span><div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center"><Utensils className="w-4 h-4" /></div></div><p className="font-heading font-black text-xl text-[#2D2D2D]">{bookings.length} réservées</p><p className="text-[10px] text-purple-700 font-black mt-1">En direct</p></div>
      </div>

      <div className="bg-white rounded-[32px] p-6 border border-[#F0EDE8] shadow-artistic space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EDE8]"><div><h3 className="font-heading font-black text-lg text-[#2D2D2D]">Flux des commandes en direct</h3><p className="text-xs text-gray-500 font-medium">Gérez et mettez à jour les statuts en direct dans la base de données</p></div><div className="flex gap-1.5 overflow-x-auto no-scrollbar bg-[#F7F5F0] p-1 rounded-2xl border border-[#F0EDE8]">{['all', 'pending', 'preparing', 'delivering', 'delivered'].map((filter) => <button key={filter} onClick={() => setSelectedStatusFilter(filter)} className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${selectedStatusFilter === filter ? 'bg-[#006633] text-white shadow-xs' : 'text-gray-600 hover:text-[#2D2D2D]'}`}>{filter === 'all' ? 'Toutes' : filter}</button>)}</div></div>
        <div className="space-y-3">{visibleOrders.length === 0 ? <div className="text-center py-10 text-gray-400"><ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-xs font-bold">Aucune commande enregistrée pour ce filtre.</p><p className="text-[11px]">Les nouvelles commandes apparaîtront ici en direct.</p></div> : visibleOrders.map((order) => <div key={order.id} className="p-4 sm:p-5 rounded-[24px] border border-[#F0EDE8] hover:border-[#006633]/30 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-2xs"><div className="space-y-1.5"><div className="flex items-center gap-2"><span className="font-black text-xs text-[#006633]">{order.id}</span><span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006633] text-[10px] font-black uppercase tracking-wider">{order.orderStatus}</span><span className="text-xs font-black text-[#2D2D2D]">{order.total.toLocaleString()} FCFA</span></div><p className="text-xs font-bold text-[#2D2D2D]">{order.customerName} → {order.restaurantName}</p><p className="text-[11px] text-gray-500 flex items-center gap-1 font-medium"><MapPin className="w-3 h-3 text-[#006633]" />{order.deliveryAddress?.neighborhood || 'Dakar'} ({order.deliveryAddress?.streetAddress || ''})</p></div><div className="flex items-center gap-1.5 flex-wrap">{(['preparing', 'ready', 'delivering', 'delivered'] as OrderStatus[]).map((st) => <button key={st} onClick={async () => { await updateOrderStatus(order.id, st); showToast(`Statut commande ${order.id} mis à jour : ${st}`); }} className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 ${order.orderStatus === st ? 'bg-[#006633] text-white shadow-xs' : 'bg-white border border-[#F0EDE8] text-gray-700 hover:bg-gray-100'}`}>{st}</button>)}</div></div>)}</div>
      </div>
    </div>
  );
};
