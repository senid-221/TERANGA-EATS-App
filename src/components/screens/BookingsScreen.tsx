import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TableBooking } from '../../types';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  PartyPopper,
  Phone,
  Plus,
  Sparkles,
  Users,
  Utensils,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';

interface BookingsScreenProps {
  onBack?: () => void;
  onOpenBookingModal?: () => void;
}

export const BookingsScreen: React.FC<BookingsScreenProps> = ({
  onBack,
  onOpenBookingModal,
}) => {
  const {
    t,
    language,
    bookings,
    cancelBooking,
    setActiveTab,
    openBookingModal,
    showToast,
  } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<TableBooking | null>(null);

  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
  const pastBookings = bookings.filter((b) => b.status === 'cancelled' || b.status === 'completed');

  const displayedBookings = activeTabFilter === 'upcoming' ? upcomingBookings : pastBookings;

  const handleConfirmCancel = () => {
    if (selectedBookingForCancel) {
      cancelBooking(selectedBookingForCancel.id);
      setSelectedBookingForCancel(null);
    }
  };

  const handleBackNav = () => {
    if (onBack) {
      onBack();
    } else {
      setActiveTab('home');
    }
  };

  const getSeatingLabel = (area: string) => {
    switch (area) {
      case 'indoor_ac':
        return { label: 'Salle Climatisée', icon: '❄️' };
      case 'terrace':
        return { label: 'Terrasse Extérieure', icon: '🌿' };
      case 'vip_room':
        return { label: 'Salon VIP Privé', icon: '👑' };
      case 'rooftop':
        return { label: 'Rooftop Vue Mer', icon: '🌆' };
      default:
        return { label: 'Table Standard', icon: '🪑' };
    }
  };

  return (
    <div id="bookings-screen" className="min-h-screen bg-[#FAF8F5] pb-28">
      {/* Top Header Bar with Back Button */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-4 border-b border-[#F0EDE8] shadow-artistic">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="bookings-back-button"
              type="button"
              onClick={handleBackNav}
              className="w-11 h-11 rounded-2xl bg-white border border-[#F0EDE8] text-[#2D2D2D] flex items-center justify-center shadow-2xs hover:bg-[#F0EDE8] cursor-pointer transition-all active:scale-95"
              aria-label={t('back')}
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#006633]">
                  Teranga Dakar
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-[10px] font-bold text-gray-500">
                  {upcomingBookings.length} active(s)
                </span>
              </div>
              <h1 className="font-heading font-black text-lg sm:text-xl text-[#2D2D2D]">
                {t('myBookingsTitle')}
              </h1>
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenBookingModal) {
                onOpenBookingModal();
              } else {
                openBookingModal();
              }
            }}
            className="px-4 py-2.5 rounded-2xl bg-[#006633] text-white font-black text-xs hover:bg-[#00552B] transition-all cursor-pointer shadow-artistic flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('bookTable')}</span>
            <span className="sm:hidden">Réserver</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Sub-hero info banner */}
        <div className="bg-gradient-to-r from-[#006633] via-[#00552B] to-[#1F2937] text-white rounded-[32px] p-6 shadow-artistic flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl shadow-xs border border-white/20 shrink-0">
              🍽️
            </div>
            <div>
              <span className="text-[10px] font-black text-[#FFCC00] uppercase tracking-wider">
                Sorties & Gastronomie
              </span>
              <h2 className="font-heading font-black text-lg sm:text-xl text-white">
                Réservation de table en direct
              </h2>
              <p className="text-xs text-white/80 mt-0.5 font-medium">
                Retrouvez vos confirmations de table à Dakar sans attente
              </p>
            </div>
          </div>

          <button
            onClick={() => openBookingModal()}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#FFCC00] text-amber-950 font-black text-xs hover:bg-yellow-300 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
          >
            + Nouvelle réservation
          </button>
        </div>

        {/* Tab Filter Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#F0EDE8] max-w-sm">
          <button
            onClick={() => setActiveTabFilter('upcoming')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTabFilter === 'upcoming'
                ? 'bg-white text-[#006633] shadow-xs'
                : 'text-gray-600 hover:text-[#2D2D2D]'
            }`}
          >
            {t('tabUpcomingBookings')} ({upcomingBookings.length})
          </button>

          <button
            onClick={() => setActiveTabFilter('past')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTabFilter === 'past'
                ? 'bg-white text-[#2D2D2D] shadow-xs'
                : 'text-gray-600 hover:text-[#2D2D2D]'
            }`}
          >
            {t('tabPastBookings')} ({pastBookings.length})
          </button>
        </div>

        {/* Bookings List */}
        {displayedBookings.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 border border-[#F0EDE8] shadow-artistic text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F7F5F0] text-gray-400 flex items-center justify-center mx-auto text-2xl">
              📅
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-[#2D2D2D]">
                {t('noBookingsFound')}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                {t('noBookingsDesc')}
              </p>
            </div>

            <button
              onClick={() => openBookingModal()}
              className="px-6 py-3.5 rounded-2xl bg-[#006633] text-white font-black text-xs hover:bg-[#00552B] transition-all cursor-pointer shadow-artistic active:scale-95 inline-flex items-center gap-2"
            >
              <Utensils className="w-4 h-4" />
              <span>{t('bookTable')}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedBookings.map((booking) => {
              const seating = getSeatingLabel(booking.seatingArea);
              const isCancelled = booking.status === 'cancelled';

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-[32px] p-5 sm:p-6 border shadow-artistic space-y-4 transition-all ${
                    isCancelled
                      ? 'border-gray-200/80 opacity-75'
                      : 'border-[#F0EDE8] hover:border-emerald-200'
                  }`}
                >
                  {/* Card Header: Restaurant info & status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#F0EDE8]">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={booking.restaurantLogo}
                        alt={booking.restaurantName}
                        className="w-13 h-13 rounded-2xl object-cover ring-2 ring-emerald-50 shadow-2xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#006633]">
                            {booking.confirmationCode}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs font-bold text-gray-500">
                            {booking.restaurantNeighborhood}
                          </span>
                        </div>
                        <h3 className="font-heading font-black text-base sm:text-lg text-[#2D2D2D]">
                          {booking.restaurantName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          isCancelled
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-[#006633]'
                        }`}
                      >
                        {isCancelled ? t('statusCancelled') : t('statusConfirmed')}
                      </span>
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F7F5F0] p-4 rounded-[24px] border border-[#F0EDE8] text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#006633]" />
                        <span>Date</span>
                      </span>
                      <p className="font-black text-[#2D2D2D]">{booking.date}</p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#FFCC00]" />
                        <span>Heure</span>
                      </span>
                      <p className="font-black text-[#2D2D2D]">{booking.time}</p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#E8702A]" />
                        <span>Convives</span>
                      </span>
                      <p className="font-black text-[#2D2D2D]">
                        {booking.guestsCount} {booking.guestsCount > 1 ? 'personnes' : 'personne'}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span>Emplacement</span>
                      </span>
                      <p className="font-black text-[#2D2D2D] flex items-center gap-1">
                        <span>{seating.icon}</span>
                        <span className="truncate">{seating.label}</span>
                      </p>
                    </div>
                  </div>

                  {/* Special Requests & Guest Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-600 gap-2">
                    <div className="space-y-1">
                      <p className="font-medium">
                        <span className="font-bold text-[#2D2D2D]">Réservé par :</span> {booking.guestName} ({booking.guestPhone})
                      </p>
                      {booking.occasion && (
                        <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                          <PartyPopper className="w-3 h-3 text-[#E8702A]" />
                          <span>Occasion : {booking.occasion}</span>
                        </p>
                      )}
                      {booking.specialRequests && (
                        <p className="text-[11px] text-gray-500 italic">
                          "{booking.specialRequests}"
                        </p>
                      )}
                    </div>

                    <div className="text-[11px] text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FFCC00] shrink-0" />
                      <span className="truncate max-w-[240px]">{booking.restaurantAddress}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-[#F0EDE8] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${booking.restaurantPhone}`}
                        className="px-4 py-2.5 rounded-xl bg-emerald-50 text-[#006633] font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{t('callRestaurant')}</span>
                      </a>
                    </div>

                    {!isCancelled && (
                      <button
                        onClick={() => setSelectedBookingForCancel(booking)}
                        className="px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1.5 ml-auto"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{t('cancelBookingBtn')}</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog Modal */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-[#F0EDE8] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-heading font-black text-base text-[#2D2D2D]">
                {t('cancelBookingBtn')}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {t('cancelBookingConfirm')} ({selectedBookingForCancel.restaurantName} • {selectedBookingForCancel.date})
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedBookingForCancel(null)}
                className="flex-1 py-3 rounded-2xl bg-[#F7F5F0] text-gray-700 font-bold text-xs hover:bg-gray-200 cursor-pointer"
              >
                {t('back')}
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-black text-xs hover:bg-red-700 cursor-pointer shadow-xs"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
