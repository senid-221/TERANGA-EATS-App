import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';
import {
  ArrowLeft,
  Bell,
  BellRing,
  Calendar,
  Check,
  CheckCheck,
  ChefHat,
  ChevronRight,
  Clock,
  Flame,
  MapPin,
  Motorbike,
  Phone,
  Play,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  UtensilsCrossed,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification } from '../../types';

export const NotificationsScreen: React.FC = () => {
  const {
    t,
    language,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    simulateNextOrderStep,
    triggerSimulatedScenario,
    isAutoSimulationActive,
    toggleAutoSimulation,
    setActiveTab,
    setSelectedOrderId,
    showToast,
    orders,
    activeOrder,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'order' | 'booking' | 'promo'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSimulatorPanel, setShowSimulatorPanel] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Type filter
      if (activeFilter !== 'all') {
        if (activeFilter === 'order' && notif.type !== 'order' && notif.type !== 'driver') {
          return false;
        }
        if (activeFilter === 'booking' && notif.type !== 'booking') {
          return false;
        }
        if (activeFilter === 'promo' && notif.type !== 'promo') {
          return false;
        }
      }

      // Unread only filter
      if (unreadOnly && notif.read) {
        return false;
      }

      // Search text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (language === 'fr' ? notif.titleFR : notif.titleEN).toLowerCase();
        const message = (language === 'fr' ? notif.messageFR : notif.messageEN).toLowerCase();
        const rest = (notif.restaurantName || '').toLowerCase();
        const orderId = (notif.orderId || '').toLowerCase();
        return title.includes(q) || message.includes(q) || rest.includes(q) || orderId.includes(q);
      }

      return true;
    });
  }, [notifications, activeFilter, unreadOnly, searchQuery, language]);

  // Relative time helper
  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) {
        return language === 'fr' ? 'À l’instant' : 'Just now';
      }
      if (diffMin < 60) {
        return language === 'fr' ? `Il y a ${diffMin} min` : `${diffMin}m ago`;
      }
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) {
        return language === 'fr' ? `Il y a ${diffHours} h` : `${diffHours}h ago`;
      }
      return new Date(isoString).toLocaleDateString(language === 'fr' ? 'fr-SN' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return language === 'fr' ? 'Récemment' : 'Recently';
    }
  };

  const getStatusIcon = (notif: AppNotification) => {
    switch (notif.orderStatus) {
      case 'accepted':
        return <ChefHat className="w-5 h-5 text-amber-600" />;
      case 'preparing':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'picked_up':
      case 'delivering':
        return <Motorbike className="w-5 h-5 text-[#006633]" />;
      case 'driver_arrived':
        return <MapPin className="w-5 h-5 text-emerald-600 animate-bounce" />;
      case 'delivered':
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
      default:
        if (notif.type === 'promo') {
          return <Tag className="w-5 h-5 text-[#E31B23]" />;
        }
        if (notif.type === 'booking') {
          return <UtensilsCrossed className="w-5 h-5 text-[#006633]" />;
        }
        if (notif.type === 'driver') {
          return <Motorbike className="w-5 h-5 text-blue-600" />;
        }
        return <Bell className="w-5 h-5 text-[#006633]" />;
    }
  };

  const handleNotificationAction = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);

    if (notif.actionType === 'call_driver' || notif.orderStatus === 'driver_arrived') {
      showToast(
        language === 'fr'
          ? 'Appel du livreur Amadou Diallo (+221 77 456 78 90)...'
          : 'Calling driver Amadou Diallo (+221 77 456 78 90)...'
      );
      return;
    }

    if (notif.orderId) {
      setSelectedOrderId(notif.orderId);
      setActiveTab('orders');
      return;
    }

    if (notif.type === 'booking') {
      setActiveTab('profile');
      return;
    }

    if (notif.type === 'promo') {
      setActiveTab('home');
      showToast(
        language === 'fr'
          ? 'Code TERANGAFLASH copié ! Profitez de la réduction.'
          : 'Code TERANGAFLASH copied! Enjoy your discount.'
      );
    }
  };

  const currentActiveOrder = activeOrder || orders[0];

  return (
    <div
      id="notifications-center-screen"
      className="p-4 sm:p-6 pb-28 max-w-3xl mx-auto space-y-5"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="notifications-back-btn"
            onClick={() => setActiveTab('home')}
            className="w-10 h-10 rounded-2xl bg-white border border-[#F0EDE8] text-[#2D2D2D] flex items-center justify-center shadow-xs hover:bg-[#F0EDE8] cursor-pointer transition-all active:scale-95"
            aria-label={t('back')}
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-lg sm:text-2xl text-[#2D2D2D] flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[#006633]" />
                <span>{language === 'fr' ? 'Centre de Notifications' : 'Notification Center'}</span>
              </h2>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#E8702A] text-white text-[11px] font-black animate-pulse">
                  {unreadNotificationsCount} {language === 'fr' ? 'non lues' : 'new'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {language === 'fr'
                ? 'Mises à jour en direct de vos commandes & Teranga Dakar'
                : 'Real-time live updates for your orders & Dakar Teranga'}
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <button
                id="mark-all-read-btn"
                onClick={markAllNotificationsAsRead}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#F0EDE8] text-[#006633] text-xs font-black hover:bg-emerald-50 cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'fr' ? 'Tout marquer comme lu' : 'Mark all read'}</span>
              </button>

              <button
                id="clear-all-notifs-btn"
                onClick={() => setShowClearConfirm(true)}
                className="p-2 rounded-xl bg-white border border-[#F0EDE8] text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all shadow-2xs active:scale-95"
                title={language === 'fr' ? 'Effacer tout' : 'Clear all'}
                aria-label="Clear all notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Interactive Real-Time Status Simulation Dock */}
      <div
        id="live-status-simulation-card"
        className="bg-linear-to-r from-[#006633] via-[#0E331E] to-[#122A1E] text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-emerald-800/40 relative overflow-hidden"
      >
        {/* Senegalese Decorative Watermark */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
          <Motorbike className="w-44 h-44 text-white" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shadow-md">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="font-heading font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                  <span>{language === 'fr' ? 'Simulateur de Statut en Direct' : 'Live Status Simulator'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-[#FFCC00] border border-amber-400/30 uppercase tracking-widest font-bold">
                    Demo
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-200">
                  {language === 'fr'
                    ? 'Déclenchez des alertes push et observez les changements d’état en temps réel'
                    : 'Trigger push alerts and experience real-time order lifecycle transitions'}
                </p>
              </div>
            </div>

            {/* Auto Simulation Toggle */}
            <button
              id="auto-simulation-toggle-btn"
              onClick={toggleAutoSimulation}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all cursor-pointer shadow-md active:scale-95 ${
                isAutoSimulationActive
                  ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300/40 animate-pulse'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAutoSimulationActive ? 'bg-slate-900 animate-ping' : 'bg-gray-400'}`} />
              <span>
                {isAutoSimulationActive
                  ? (language === 'fr' ? 'Auto Simulation : ACTIVE (12s)' : 'Auto Sim: ACTIVE (12s)')
                  : (language === 'fr' ? 'Activer Auto Sim' : 'Enable Auto Sim')}
              </span>
            </button>
          </div>

          {/* Current Active Order Status Preview */}
          {currentActiveOrder && (
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-300 font-bold">
                  {language === 'fr' ? 'Commande active :' : 'Active Order:'}
                </span>
                <span className="font-black bg-white/20 px-2 py-0.5 rounded-md text-[#FFCC00]">
                  #{currentActiveOrder.id}
                </span>
                <span className="text-gray-300 truncate max-w-[140px]">
                  ({currentActiveOrder.restaurantName})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-300">{language === 'fr' ? 'Statut :' : 'Status:'}</span>
                <span className="font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[11px]">
                  {currentActiveOrder.orderStatus}
                </span>
              </div>
            </div>
          )}

          {/* Quick Trigger Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Primary Step-by-Step Advancer */}
            <button
              id="simulate-next-step-btn"
              onClick={() => simulateNextOrderStep()}
              className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shrink-0 shadow-lg cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{language === 'fr' ? 'Avancer d’un statut ⏩' : 'Next Order Step ⏩'}</span>
            </button>

            {/* Direct Scenario 1: Order Accepted */}
            <button
              id="sim-order-accepted-btn"
              onClick={() => triggerSimulatedScenario('order_accepted')}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 border border-white/10 cursor-pointer active:scale-95"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'fr' ? '1. Acceptée 👨‍🍳' : '1. Accepted 👨‍🍳'}</span>
            </button>

            {/* Direct Scenario 2: Kitchen Cooking */}
            <button
              id="sim-kitchen-prep-btn"
              onClick={() => triggerSimulatedScenario('kitchen_prep')}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 border border-white/10 cursor-pointer active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>{language === 'fr' ? '2. En Cuisine 🍲' : '2. Cooking 🍲'}</span>
            </button>

            {/* Direct Scenario 3: Driver Arrived (Target feature highlight) */}
            <button
              id="sim-driver-arrived-btn"
              onClick={() => triggerSimulatedScenario('driver_arrived')}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer active:scale-95 ring-2 ring-emerald-300/50"
            >
              <MapPin className="w-3.5 h-3.5 fill-current animate-bounce" />
              <span>{language === 'fr' ? '3. Livreur Arrivé 📍' : '3. Driver Arrived 📍'}</span>
            </button>

            {/* Direct Scenario 4: Delivered */}
            <button
              id="sim-order-delivered-btn"
              onClick={() => triggerSimulatedScenario('order_delivered')}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 border border-white/10 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span>{language === 'fr' ? '4. Livrée 🇸🇳' : '4. Delivered 🇸🇳'}</span>
            </button>

            {/* Promo Trigger */}
            <button
              id="sim-promo-dakar-btn"
              onClick={() => triggerSimulatedScenario('promo_dakar')}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 border border-white/10 cursor-pointer active:scale-95"
            >
              <Tag className="w-3.5 h-3.5 text-rose-300" />
              <span>{language === 'fr' ? 'Flash Promo 🎉' : 'Flash Promo 🎉'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              id="filter-notif-all-btn"
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-[#006633] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-[#F0EDE8] hover:bg-gray-50'
              }`}
            >
              {language === 'fr' ? 'Toutes' : 'All'} ({notifications.length})
            </button>

            <button
              id="filter-notif-orders-btn"
              onClick={() => setActiveFilter('order')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeFilter === 'order'
                  ? 'bg-[#006633] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-[#F0EDE8] hover:bg-gray-50'
              }`}
            >
              <Motorbike className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Commandes en direct' : 'Live Orders'}</span>
            </button>

            <button
              id="filter-notif-bookings-btn"
              onClick={() => setActiveFilter('booking')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeFilter === 'booking'
                  ? 'bg-[#006633] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-[#F0EDE8] hover:bg-gray-50'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Tables' : 'Tables'}</span>
            </button>

            <button
              id="filter-notif-promos-btn"
              onClick={() => setActiveFilter('promo')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeFilter === 'promo'
                  ? 'bg-[#006633] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-[#F0EDE8] hover:bg-gray-50'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Promos' : 'Promos'}</span>
            </button>
          </div>

          {/* Unread Only Toggle */}
          <button
            id="toggle-unread-only-btn"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              unreadOnly
                ? 'bg-[#E8702A] text-white border-[#E8702A]'
                : 'bg-white text-gray-600 border-[#F0EDE8] hover:bg-gray-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${unreadOnly ? 'bg-white' : 'bg-gray-400'}`} />
            <span>{language === 'fr' ? 'Non lues uniquement' : 'Unread only'}</span>
          </button>
        </div>

        {/* Search Filter Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'fr'
                ? 'Rechercher une notification, un restaurant ou un livreur...'
                : 'Search notifications, restaurants, or couriers...'
            }
            className="w-full pl-10 pr-9 py-2.5 bg-white rounded-2xl border border-[#F0EDE8] text-xs sm:text-sm text-[#2D2D2D] placeholder:text-gray-400 focus:outline-hidden focus:border-[#006633] shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#F0EDE8] shadow-artistic space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#006633] flex items-center justify-center mx-auto text-2xl shadow-inner">
            🔔
          </div>
          <div>
            <h3 className="font-heading font-black text-base text-[#2D2D2D]">
              {language === 'fr' ? 'Aucune notification trouvée' : 'No notifications found'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              {language === 'fr'
                ? 'Utilisez le simulateur ci-dessus pour déclencher des mises à jour en direct ou parcourez nos restaurants.'
                : 'Use the simulator above to trigger real-time order updates or explore Dakar restaurants.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            <button
              onClick={() => triggerSimulatedScenario('driver_arrived')}
              className="px-4 py-2 bg-[#006633] text-white rounded-xl text-xs font-black hover:bg-[#004d26] cursor-pointer transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Simuler Livreur Arrivé 📍' : 'Simulate Driver Arrived 📍'}</span>
            </button>

            <button
              onClick={() => setActiveTab('home')}
              className="px-4 py-2 bg-[#F7F5F0] text-[#2D2D2D] border border-[#F0EDE8] rounded-xl text-xs font-bold hover:bg-gray-100 cursor-pointer transition-all"
            >
              {t('browseRestaurants')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredNotifications.map((notif) => {
              const title = language === 'fr' ? notif.titleFR : notif.titleEN;
              const message = language === 'fr' ? notif.messageFR : notif.messageEN;
              const badge =
                language === 'fr'
                  ? notif.badgeLabelFR || (notif.orderStatus ? notif.orderStatus.toUpperCase() : 'NOTIFICATION')
                  : notif.badgeLabelEN || (notif.orderStatus ? notif.orderStatus.toUpperCase() : 'NOTIFICATION');

              const isDriverArrived = notif.orderStatus === 'driver_arrived';

              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all relative overflow-hidden group ${
                    isDriverArrived
                      ? 'bg-linear-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-300 ring-2 ring-emerald-400/20 shadow-md'
                      : !notif.read
                      ? 'bg-emerald-50/60 border-emerald-200/90 shadow-artistic'
                      : 'bg-white border-[#F0EDE8] shadow-artistic hover:border-gray-300'
                  }`}
                >
                  {/* Driver Arrived Accent Glow */}
                  {isDriverArrived && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 via-[#FFCC00] to-emerald-500 animate-pulse" />
                  )}

                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Visual Icon Badge */}
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border transition-transform group-hover:scale-105 ${
                        isDriverArrived
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : notif.orderStatus === 'accepted'
                          ? 'bg-amber-100 border-amber-200 text-amber-800'
                          : notif.orderStatus === 'preparing'
                          ? 'bg-orange-100 border-orange-200 text-orange-800'
                          : notif.orderStatus === 'delivering'
                          ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                          : notif.type === 'promo'
                          ? 'bg-rose-100 border-rose-200 text-rose-800'
                          : notif.type === 'booking'
                          ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                      }`}
                    >
                      {getStatusIcon(notif)}
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              isDriverArrived
                                ? 'bg-emerald-600 text-white border-emerald-700 animate-pulse'
                                : 'bg-white text-[#006633] border-[#006633]/30'
                            }`}
                          >
                            {badge}
                          </span>

                          {notif.orderId && (
                            <span className="text-[11px] font-bold text-gray-500">
                              #{notif.orderId}
                            </span>
                          )}

                          <span className="text-[11px] text-gray-400 font-medium">
                            • {getRelativeTime(notif.createdAt)}
                          </span>
                        </div>

                        {/* Read status & Delete */}
                        <div className="flex items-center gap-1.5">
                          {!notif.read ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#E8702A] ring-4 ring-orange-100 animate-ping" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-gray-300" />
                          )}

                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title={language === 'fr' ? 'Supprimer' : 'Delete'}
                            aria-label="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Main Message */}
                      <h4 className="font-heading font-black text-sm sm:text-base text-[#2D2D2D] mt-1.5 leading-snug">
                        {title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                        {message}
                      </p>

                      {/* Interactive Call to Action buttons */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {/* If order notification */}
                        {notif.orderId && (
                          <button
                            id={`track-order-notif-${notif.id}`}
                            onClick={() => handleNotificationAction(notif)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#006633] text-white text-xs font-black hover:bg-[#004d26] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Motorbike className="w-3.5 h-3.5" />
                            <span>{language === 'fr' ? 'Suivre en direct' : 'Track Live'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* If driver arrived, highlight calling Amadou */}
                        {isDriverArrived && (
                          <button
                            id={`call-driver-notif-${notif.id}`}
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              showToast(
                                language === 'fr'
                                  ? 'Appel du livreur Amadou (+221 77 456 78 90)...'
                                  : 'Calling driver Amadou (+221 77 456 78 90)...'
                              );
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Phone className="w-3.5 h-3.5 fill-current" />
                            <span>{language === 'fr' ? 'Appeler Amadou 📞' : 'Call Amadou 📞'}</span>
                          </button>
                        )}

                        {/* If table booking */}
                        {notif.type === 'booking' && (
                          <button
                            onClick={() => handleNotificationAction(notif)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#006633] text-white text-xs font-black hover:bg-[#004d26] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{language === 'fr' ? 'Voir ma table' : 'View Booking'}</span>
                          </button>
                        )}

                        {/* If promo */}
                        {notif.type === 'promo' && (
                          <button
                            onClick={() => handleNotificationAction(notif)}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>{language === 'fr' ? 'Utiliser le code TERANGAFLASH' : 'Use TERANGAFLASH Code'}</span>
                          </button>
                        )}

                        {/* Mark read button if still unread */}
                        {!notif.read && (
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#F0EDE8] text-gray-500 hover:text-[#006633] text-xs font-bold transition-all cursor-pointer active:scale-95"
                          >
                            {language === 'fr' ? 'Marquer comme lu' : 'Mark as read'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Confirmation Modal to Clear All Notifications */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-[#2D2D2D]">
                  {language === 'fr' ? 'Effacer toutes les notifications ?' : 'Clear all notifications?'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'fr'
                    ? 'Cette action supprimera tout l’historique des notifications reçues.'
                    : 'This action will delete your entire notification history.'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 cursor-pointer"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    clearAllNotifications();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 cursor-pointer shadow-md"
                >
                  {language === 'fr' ? 'Oui, effacer' : 'Yes, clear'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
