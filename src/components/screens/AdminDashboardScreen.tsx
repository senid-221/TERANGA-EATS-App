import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Motorbike,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  Utensils,
} from 'lucide-react';
import { OrderStatus } from '../../types';

export const AdminDashboardScreen: React.FC = () => {
  const { t, language, orders, restaurants, updateOrderStatus, switchRole, showToast } = useApp();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const activeOrdersCount = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;

  return (
    <div id="admin-dashboard" className="p-4 sm:p-6 pb-28 max-w-7xl mx-auto space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-[#006633] via-[#0A522A] to-[#1F2937] text-white rounded-[32px] p-6 sm:p-8 shadow-artistic-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <button
              onClick={() => switchRole('customer')}
              className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Mode Client</span>
            </button>
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#FFCC00] text-xs font-black uppercase tracking-wider">
              👑 Teranga HQ
            </span>
            <span className="text-xs text-white/80 font-semibold">🇸🇳 Dakar Operations</span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white">
            {t('adminDashboardTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-white/70 mt-1 font-medium">
            Supervision en temps réel des commandes, restaurants et flotte de livreurs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30 flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Système opérationnel
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">{t('adminTotalSales')}</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#006633] flex items-center justify-center font-black shadow-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-xl text-[#2D2D2D]">
            {totalRevenue.toLocaleString()} FCFA
          </p>
          <p className="text-[10px] text-[#006633] font-black mt-1">↑ +18% cette semaine</p>
        </div>

        <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">{t('adminTotalOrders')}</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-xl text-[#2D2D2D]">
            {orders.length} commandes
          </p>
          <p className="text-[10px] text-amber-700 font-black mt-1">{activeOrdersCount} en cours</p>
        </div>

        <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">{t('adminActiveRestaurants')}</span>
            <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#007CB0] flex items-center justify-center font-black shadow-xs">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-xl text-[#2D2D2D]">
            {restaurants.length} partenaires
          </p>
          <p className="text-[10px] text-sky-700 font-black mt-1">100% ouverts</p>
        </div>

        <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">{t('adminActiveDrivers')}</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center font-black shadow-xs">
              <Motorbike className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-xl text-[#2D2D2D]">
            24 livreurs
          </p>
          <p className="text-[10px] text-purple-700 font-black mt-1">Dakar Zone 1 & 2</p>
        </div>
      </div>

      {/* Live Orders Supervision Table */}
      <div className="bg-white rounded-[32px] p-6 border border-[#F0EDE8] shadow-artistic space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EDE8]">
          <div>
            <h3 className="font-heading font-black text-lg text-[#2D2D2D]">
              Flux des commandes en direct
            </h3>
            <p className="text-xs text-gray-500 font-medium">Gérez les statuts des commandes des clients</p>
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar bg-[#F7F5F0] p-1 rounded-2xl border border-[#F0EDE8]">
            {['all', 'pending', 'preparing', 'delivering', 'delivered'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedStatusFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  selectedStatusFilter === filter
                    ? 'bg-[#006633] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#2D2D2D]'
                }`}
              >
                {filter === 'all' ? 'Toutes' : filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {orders
            .filter((o) => (selectedStatusFilter === 'all' ? true : o.status === selectedStatusFilter))
            .map((order) => (
              <div
                key={order.id}
                className="p-4 sm:p-5 rounded-[24px] border border-[#F0EDE8] hover:border-[#006633]/30 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-[#006633]">{order.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006633] text-[10px] font-black uppercase tracking-wider">
                      {order.status}
                    </span>
                    <span className="text-xs font-black text-[#2D2D2D]">
                      {order.total.toLocaleString()} FCFA
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#2D2D2D]">
                    {order.customerName} → {order.restaurantName}
                  </p>

                  <p className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-[#006633]" />
                    {order.deliveryAddress.neighborhood} ({order.deliveryAddress.streetAddress})
                  </p>
                </div>

                {/* Quick Status Modifiers */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['preparing', 'ready', 'delivering', 'delivered'] as OrderStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        updateOrderStatus(order.id, st);
                        showToast(`Statut commande ${order.id} changé en ${st}`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 ${
                        order.status === st
                          ? 'bg-[#006633] text-white shadow-xs'
                          : 'bg-white border border-[#F0EDE8] text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
