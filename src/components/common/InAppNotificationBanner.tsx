import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Clock,
  MapPin,
  Motorbike,
  Phone,
  Sparkles,
  Tag,
  UtensilsCrossed,
  X,
} from 'lucide-react';

export const InAppNotificationBanner: React.FC = () => {
  const {
    latestAlertNotification,
    dismissAlertNotification,
    language,
    setActiveTab,
    setSelectedOrderId,
    showToast,
  } = useApp();

  if (!latestAlertNotification) return null;

  const getStatusIcon = () => {
    switch (latestAlertNotification.orderStatus) {
      case 'accepted':
        return <ChefHat className="w-5 h-5 text-amber-600" />;
      case 'preparing':
        return <Clock className="w-5 h-5 text-amber-500 animate-spin" />;
      case 'picked_up':
      case 'delivering':
        return <Motorbike className="w-5 h-5 text-[#006633]" />;
      case 'driver_arrived':
        return <MapPin className="w-5 h-5 text-emerald-600 animate-bounce" />;
      case 'delivered':
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
      default:
        if (latestAlertNotification.type === 'promo') {
          return <Tag className="w-5 h-5 text-[#E31B23]" />;
        }
        if (latestAlertNotification.type === 'booking') {
          return <UtensilsCrossed className="w-5 h-5 text-[#006633]" />;
        }
        return <Bell className="w-5 h-5 text-[#006633]" />;
    }
  };

  const getStatusBadge = () => {
    if (language === 'fr') {
      return latestAlertNotification.badgeLabelFR || 'DIRECT DAKAR';
    }
    return latestAlertNotification.badgeLabelEN || 'LIVE DAKAR';
  };

  const handleClickAction = () => {
    dismissAlertNotification();
    if (latestAlertNotification.orderId) {
      setSelectedOrderId(latestAlertNotification.orderId);
      setActiveTab('orders');
    } else if (latestAlertNotification.type === 'booking') {
      setActiveTab('profile');
    } else if (latestAlertNotification.type === 'promo') {
      setActiveTab('home');
      showToast(language === 'fr' ? 'Code promo TERANGAFLASH copié !' : 'Promo code TERANGAFLASH copied!');
    } else {
      setActiveTab('notifications');
    }
  };

  const title =
    language === 'fr'
      ? latestAlertNotification.titleFR
      : latestAlertNotification.titleEN;

  const message =
    language === 'fr'
      ? latestAlertNotification.messageFR
      : latestAlertNotification.messageEN;

  return (
    <AnimatePresence>
      <div
        id="in-app-notification-banner-container"
        className="fixed top-4 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none"
      >
        <motion.div
          id="in-app-notification-banner"
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border-2 border-[#006633]/20 ring-4 ring-emerald-500/10 flex items-start gap-3 cursor-pointer hover:bg-white transition-all group"
          onClick={handleClickAction}
        >
          {/* Status Icon Badge */}
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            {getStatusIcon()}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#006633]/10 text-[#006633] border border-[#006633]/20">
                {getStatusBadge()}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-semibold text-gray-400">
                {language === 'fr' ? 'À l’instant' : 'Just now'}
              </span>
            </div>

            <h4 className="font-heading font-black text-xs sm:text-sm text-[#2D2D2D] leading-snug line-clamp-1">
              {title}
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-600 line-clamp-2 mt-0.5 leading-relaxed">
              {message}
            </p>

            {/* Quick Action Link */}
            <div className="flex items-center gap-1 mt-1.5 text-[11px] font-black text-[#006633] group-hover:underline">
              <span>{language === 'fr' ? 'Appuyez pour voir' : 'Tap to view'}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            id="dismiss-push-notification-btn"
            onClick={(e) => {
              e.stopPropagation();
              dismissAlertNotification();
            }}
            className="w-7 h-7 rounded-lg bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 flex items-center justify-center shrink-0 active:scale-90 transition-all cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
