import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';
import { ArrowLeft, Clock, MapPin, Motorbike, RotateCcw, Sparkles, Utensils } from 'lucide-react';
import { Order } from '../../types';

interface OrdersHistoryScreenProps {
  onSelectOrder: (orderId: string) => void;
}

export const OrdersHistoryScreen: React.FC<OrdersHistoryScreenProps> = ({
  onSelectOrder,
}) => {
  const { t, language, orders, reorder, setActiveTab } = useApp();
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'delivered'>('all');

  const filteredOrders = orders.filter((o) => {
    if (filterTab === 'active') return o.status !== 'delivered' && o.status !== 'cancelled';
    if (filterTab === 'delivered') return o.status === 'delivered';
    return true;
  });

  return (
    <div id="orders-history-screen" className="p-4 sm:p-6 pb-28 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="w-10 h-10 rounded-2xl bg-white border border-[#F0EDE8] text-[#2D2D2D] flex items-center justify-center shadow-2xs hover:bg-[#F0EDE8] cursor-pointer transition-all active:scale-95"
            aria-label={t('back')}
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div>
            <h2 className="font-heading font-black text-lg sm:text-xl text-[#2D2D2D]">
              {t('navOrders')}
            </h2>
            <p className="text-xs text-gray-500 font-medium">Historique de vos commandes à Dakar</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-[#F7F5F0] p-1 rounded-2xl border border-[#F0EDE8] text-xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              filterTab === 'all' ? 'bg-white text-[#2D2D2D] shadow-xs' : 'text-gray-500'
            }`}
          >
            {t('tabAll')}
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              filterTab === 'active' ? 'bg-white text-[#2D2D2D] shadow-xs' : 'text-gray-500'
            }`}
          >
            En cours
          </button>
          <button
            onClick={() => setFilterTab('delivered')}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              filterTab === 'delivered' ? 'bg-white text-[#2D2D2D] shadow-xs' : 'text-gray-500'
            }`}
          >
            Livrées
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon="📦"
          title={t('emptyOrdersTitle')}
          description={t('emptyOrdersDesc')}
          actionText={t('browseRestaurants')}
          onAction={() => setActiveTab('home')}
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isActive = order.status !== 'delivered' && order.status !== 'cancelled';

            return (
              <div
                key={order.id}
                className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-3.5 hover:border-emerald-200 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EDE8]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#006633] flex items-center justify-center font-black shadow-xs">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#2D2D2D]">{order.restaurantName}</h4>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {new Date(order.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      isActive
                        ? 'bg-amber-50 text-amber-900 border border-amber-200 animate-pulse'
                        : 'bg-emerald-50 text-[#006633] border border-emerald-200'
                    }`}
                  >
                    {isActive ? 'En cours' : 'Livrée'}
                  </span>
                </div>

                {/* Items Summary */}
                <div className="text-xs text-gray-600 space-y-1.5 font-medium">
                  {order.items.map((i) => (
                    <div key={i.id} className="flex justify-between">
                      <span className="truncate max-w-[240px] text-[#2D2D2D]">
                        {i.quantity}x {language === 'fr' ? i.product.nameFR : i.product.nameEN}
                      </span>
                      <span className="font-bold text-[#2D2D2D]">
                        {i.totalPrice.toLocaleString()} FCFA
                      </span>
                    </div>
                  ))}
                </div>

                {/* Address & Price info */}
                <div className="pt-3 border-t border-[#F0EDE8] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500 truncate max-w-[180px]">
                    <MapPin className="w-3.5 h-3.5 text-[#006633] shrink-0" />
                    <span className="truncate">{order.deliveryAddress.neighborhood}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-[#006633]">
                      {order.total.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#F0EDE8] flex gap-2">
                  <button
                    onClick={() => onSelectOrder(order.id)}
                    className="flex-1 py-2.5 rounded-2xl bg-emerald-50 text-[#006633] font-black text-xs hover:bg-emerald-100 cursor-pointer text-center transition-colors flex items-center justify-center gap-1.5 active:scale-98 border border-emerald-100"
                  >
                    <Motorbike className="w-3.5 h-3.5" />
                    <span>{isActive ? t('trackMyOrder') : 'Détails de la commande'}</span>
                  </button>

                  <button
                    onClick={() => reorder(order)}
                    className="px-5 py-2.5 rounded-2xl bg-[#006633] text-white font-black text-xs hover:bg-[#004D26] cursor-pointer transition-colors flex items-center gap-1.5 active:scale-98 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('reorderBtn')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
