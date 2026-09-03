import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  ChefHat,
  Check,
  Clock,
  DollarSign,
  Flame,
  PackageCheck,
  Sparkles,
  Utensils,
  X,
  ShoppingBag,
} from 'lucide-react';
import { OrderStatus } from '../../types';

export const RestaurantDashboardScreen: React.FC = () => {
  const { t, language, orders, products, updateOrderStatus, switchRole, showToast, toggleProductAvailability } = useApp();

  // All restaurant orders or for current restaurant
  const restaurantOrders = orders;

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatus(orderId, newStatus);
    showToast(`Commande ${orderId} : ${newStatus}`);
  };

  return (
    <div id="restaurant-dashboard" className="p-4 sm:p-6 pb-28 max-w-6xl mx-auto space-y-6">
      {/* Restaurant Header */}
      <div className="bg-gradient-to-r from-[#006633] via-[#0A542A] to-[#1F2937] text-white rounded-[32px] p-6 sm:p-8 shadow-artistic-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-700/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center font-bold text-2xl shadow-xs border border-white/20">
            🍳
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
                Cuisine en direct
              </span>
              <span className="text-xs text-white/80 font-medium">Portail Restaurateur Dakar</span>
            </div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
              {t('restaurantDashboardTitle')}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30 flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Cuisine Ouverte
          </span>
        </div>
      </div>

      {/* Orders Management Columns */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-black text-lg text-[#2D2D2D] flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-[#006633]" />
            <span>Commandes en cuisine ({restaurantOrders.length})</span>
          </h3>
        </div>

        {restaurantOrders.length === 0 ? (
          <div className="bg-white rounded-[32px] p-10 border border-[#F0EDE8] shadow-artistic text-center text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-bold text-gray-600">Aucune commande en attente.</p>
            <p className="text-xs mt-1">Dès qu'un client passe commande, elle apparaîtra instantanément ici.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {restaurantOrders.map((order) => {
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-[32px] p-6 border border-[#F0EDE8] shadow-artistic flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start pb-3 border-b border-[#F0EDE8]">
                      <div>
                        <span className="text-xs font-black text-[#006633]">{order.id}</span>
                        <p className="text-xs font-bold text-[#2D2D2D] mt-0.5">{order.customerName}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
                        {order.orderStatus}
                      </span>
                    </div>

                    <div className="py-3 space-y-2 text-xs">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between font-medium">
                          <span className="text-[#2D2D2D]">
                            {item.quantity}x {language === 'fr' ? item.product.nameFR : item.product.nameEN}
                          </span>
                          <span className="text-gray-500 font-bold">{item.totalPrice.toLocaleString()} F</span>
                        </div>
                      ))}

                      {order.items[0]?.specialInstructions && (
                        <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-2xl mt-2 font-medium border border-amber-100">
                          📝 {order.items[0].specialInstructions}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Kitchen Actions */}
                  <div className="pt-3 border-t border-[#F0EDE8] flex gap-2">
                    {order.orderStatus === 'accepted' || order.orderStatus === 'pending' ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="flex-1 py-3 rounded-2xl bg-[#006633] text-white font-black text-xs hover:bg-[#00552B] cursor-pointer shadow-artistic transition-all active:scale-98"
                      >
                        🍳 Lancer la préparation
                      </button>
                    ) : order.orderStatus === 'preparing' ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="flex-1 py-3 rounded-2xl bg-[#FFCC00] text-[#2D2D2D] font-black text-xs hover:bg-yellow-400 cursor-pointer shadow-artistic transition-all active:scale-98"
                      >
                        📦 Prête pour le coursier
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'delivering')}
                        className="flex-1 py-3 rounded-2xl bg-sky-600 text-white font-black text-xs hover:bg-sky-700 cursor-pointer shadow-artistic transition-all active:scale-98"
                      >
                        🛵 Remise au livreur
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dish Availability Toggle */}
      <div className="bg-white rounded-[32px] p-6 border border-[#F0EDE8] shadow-artistic space-y-4">
        <div>
          <h3 className="font-heading font-black text-base text-[#2D2D2D]">
            Gestion de la carte et du stock des plats
          </h3>
          <p className="text-xs text-gray-500 font-medium">Activez ou désactivez les plats en cas de rupture</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {products.slice(0, 12).map((prod) => {
            const inStock = prod.available !== false;
            return (
              <div
                key={prod.id}
                className="p-4 rounded-[22px] border border-[#F0EDE8] flex items-center justify-between gap-3 bg-[#F7F5F0]"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#2D2D2D] truncate">
                    {language === 'fr' ? prod.nameFR : prod.nameEN}
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium">{prod.price.toLocaleString()} FCFA</p>
                </div>

                <button
                  onClick={() => {
                    toggleProductAvailability(prod.id);
                    showToast(inStock ? 'Plat marqué épuisé' : 'Plat marqué disponible');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 ${
                    inStock
                      ? 'bg-emerald-100 text-[#006633]'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {inStock ? 'Disponible' : 'Épuisé'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
