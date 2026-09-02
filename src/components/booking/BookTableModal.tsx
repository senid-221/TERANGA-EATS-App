import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Restaurant, SeatingArea, TableBooking } from '../../types';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  PartyPopper,
  Phone,
  Sparkles,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BookTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRestaurant?: Restaurant | null;
  onViewMyBookings?: () => void;
}

export const BookTableModal: React.FC<BookTableModalProps> = ({
  isOpen,
  onClose,
  initialRestaurant,
  onViewMyBookings,
}) => {
  const {
    t,
    language,
    restaurants,
    currentUser,
    createBooking,
    showToast,
    setActiveTab,
  } = useApp();

  // Selected Restaurant
  const [selectedRest, setSelectedRest] = useState<Restaurant>(() => {
    return initialRestaurant || restaurants[0];
  });

  // Step state: 1 (DateTime), 2 (Guests & Seating), 3 (Details), 4 (Confirmed)
  const [step, setStep] = useState<number>(1);
  const [confirmedBooking, setConfirmedBooking] = useState<TableBooking | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>('20:00');
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [seatingArea, setSeatingArea] = useState<SeatingArea>('indoor_ac');
  const [occasion, setOccasion] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Guest details
  const [guestName, setGuestName] = useState<string>(currentUser.fullName || '');
  const [guestPhone, setGuestPhone] = useState<string>(currentUser.phone || '+221 77 000 00 00');
  const [guestEmail, setGuestEmail] = useState<string>(currentUser.email || '');

  if (!isOpen) return null;

  const lunchSlots = ['12:00', '12:30', '13:00', '13:30', '14:00'];
  const dinnerSlots = ['19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];

  const seatingOptions: { id: SeatingArea; labelFR: string; labelEN: string; icon: string; descFR: string; descEN: string }[] = [
    {
      id: 'indoor_ac',
      labelFR: 'Salle Climatisée',
      labelEN: 'Air-Conditioned Indoor',
      icon: '❄️',
      descFR: 'Fraîcheur et confort feutré',
      descEN: 'Cool and cozy interior atmosphere',
    },
    {
      id: 'terrace',
      labelFR: 'Terrasse Extérieure',
      labelEN: 'Outdoor Terrace',
      icon: '🌿',
      descFR: 'Brise dakaroise et plein air',
      descEN: 'Open-air Dakar ocean breeze',
    },
    {
      id: 'vip_room',
      labelFR: 'Salon VIP / Privatisé',
      labelEN: 'VIP / Private Lounge',
      icon: '👑',
      descFR: 'Intimité pour vos réunions ou fêtes',
      descEN: 'Privacy for meetings and celebrations',
    },
    {
      id: 'rooftop',
      labelFR: 'Rooftop Vue Panoramique',
      labelEN: 'Rooftop Panoramic View',
      icon: '🌆',
      descFR: 'Vue imprenable sur la baie de Dakar',
      descEN: 'Breathtaking view over Dakar coast',
    },
  ];

  const occasions = [
    { id: 'romantic', labelFR: 'Dîner romantique', labelEN: 'Romantic Dinner', emoji: '🥂' },
    { id: 'birthday', labelFR: 'Anniversaire', labelEN: 'Birthday', emoji: '🎂' },
    { id: 'business', labelFR: 'Repas d’affaires', labelEN: 'Business Meeting', emoji: '💼' },
    { id: 'family', labelFR: 'Famille & Amis', labelEN: 'Family & Friends', emoji: '👨‍👩‍👧‍👦' },
  ];

  const handleNextStep = () => {
    if (step === 1) {
      if (!date || !time) {
        showToast(language === 'fr' ? 'Veuillez choisir une date et une heure' : 'Please select date and time');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!guestName.trim() || !guestPhone.trim()) {
        showToast(language === 'fr' ? 'Veuillez renseigner votre nom et numéro de téléphone' : 'Please enter your name and phone number');
        return;
      }
      // Create Booking
      const booking = createBooking({
        restaurantId: selectedRest.id,
        restaurantName: selectedRest.name,
        restaurantLogo: selectedRest.logoUrl,
        restaurantCoverImage: selectedRest.coverImageUrl,
        restaurantAddress: selectedRest.address,
        restaurantPhone: selectedRest.phone,
        restaurantNeighborhood: selectedRest.neighborhood,
        userId: currentUser.id,
        guestName,
        guestPhone,
        guestEmail,
        date,
        time,
        guestsCount,
        seatingArea,
        occasion,
        specialRequests,
      });

      setConfirmedBooking(booking);
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1 && step < 4) {
      setStep((prev) => prev - 1);
    } else {
      onClose();
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setConfirmedBooking(null);
    onClose();
  };

  return (
    <div
      id="book-table-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-xl rounded-[36px] shadow-2xl border border-[#F0EDE8] overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="bg-[#FDFBF7] px-6 py-4 border-b border-[#F0EDE8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step < 4 ? (
              <button
                id="booking-modal-back-btn"
                type="button"
                onClick={handlePrevStep}
                className="w-10 h-10 rounded-2xl bg-white border border-[#F0EDE8] text-[#2D2D2D] flex items-center justify-center shadow-2xs hover:bg-[#F0EDE8] cursor-pointer transition-all active:scale-95"
                aria-label={t('back')}
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#006633] flex items-center justify-center font-bold">
                <Utensils className="w-5 h-5 text-[#006633]" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#006633]">
                  {step === 4 ? 'Teranga Dakar' : `Étape ${step} sur 3`}
                </span>
                {step < 4 && (
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i === step ? 'bg-[#006633]' : i < step ? 'bg-[#FFCC00]' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <h2 className="font-heading font-black text-lg text-[#2D2D2D]">
                {step === 4 ? t('bookingSuccessTitle') : t('bookTable')}
              </h2>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="w-9 h-9 rounded-full bg-[#F7F5F0] text-gray-500 hover:text-[#2D2D2D] hover:bg-[#EAE6DF] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: Restaurant, Date & Time */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Restaurant Card Summary or Switcher */}
              <div className="p-4 rounded-[26px] bg-[#F7F5F0] border border-[#F0EDE8] flex items-center gap-3.5">
                <img
                  src={selectedRest.logoUrl}
                  alt={selectedRest.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-xs shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#006633] uppercase">Restaurant sélectionné</span>
                    <span className="text-[10px] font-bold text-gray-400">•</span>
                    <span className="text-[10px] font-bold text-gray-500">{selectedRest.neighborhood}</span>
                  </div>
                  <h4 className="font-heading font-black text-base text-[#2D2D2D] truncate">
                    {selectedRest.name}
                  </h4>
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#FFCC00]" />
                    {selectedRest.address}
                  </p>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-2.5">
                <label className="font-heading font-black text-xs sm:text-sm text-[#2D2D2D] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#006633]" />
                  <span>{t('selectDate')}</span>
                </label>

                {/* Quick Date Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDate(todayStr)}
                    className={`py-3 px-3 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                      date === todayStr
                        ? 'bg-[#006633] text-white border-[#006633] shadow-xs'
                        : 'bg-white text-gray-700 border-[#F0EDE8] hover:bg-[#F7F5F0]'
                    }`}
                  >
                    Aujourd'hui
                  </button>

                  <button
                    type="button"
                    onClick={() => setDate(tomorrowStr)}
                    className={`py-3 px-3 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                      date === tomorrowStr
                        ? 'bg-[#006633] text-white border-[#006633] shadow-xs'
                        : 'bg-white text-gray-700 border-[#F0EDE8] hover:bg-[#F7F5F0]'
                    }`}
                  >
                    Demain
                  </button>

                  <div className="relative col-span-2 sm:col-span-1">
                    <input
                      type="date"
                      min={todayStr}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-2xl border border-[#F0EDE8] bg-white text-xs font-bold text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#006633]"
                    />
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-3">
                <label className="font-heading font-black text-xs sm:text-sm text-[#2D2D2D] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#006633]" />
                  <span>{t('selectTimeSlot')}</span>
                </label>

                {/* Lunch */}
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Déjeuner (Midi)
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {lunchSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={`py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                          time === slot
                            ? 'bg-[#FFCC00] text-[#2D2D2D] ring-2 ring-[#006633] shadow-xs'
                            : 'bg-[#F7F5F0] text-gray-700 border border-[#F0EDE8] hover:bg-gray-200'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dinner */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Dîner (Soirée)
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {dinnerSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={`py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                          time === slot
                            ? 'bg-[#FFCC00] text-[#2D2D2D] ring-2 ring-[#006633] shadow-xs'
                            : 'bg-[#F7F5F0] text-gray-700 border border-[#F0EDE8] hover:bg-gray-200'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Guests & Seating Preference */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Guests counter */}
              <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-heading font-black text-sm text-[#2D2D2D] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#006633]" />
                    <span>{t('numberOfGuests')}</span>
                  </label>
                  <span className="text-xs font-bold text-gray-500">
                    {guestsCount} {guestsCount > 1 ? 'personnes' : 'personne'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setGuestsCount((prev) => Math.max(1, prev - 1))}
                    disabled={guestsCount <= 1}
                    className="w-12 h-12 rounded-2xl bg-[#F7F5F0] text-[#2D2D2D] font-black text-xl flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 cursor-pointer transition-all active:scale-95 border border-[#F0EDE8]"
                  >
                    -
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="font-heading font-black text-3xl text-[#006633]">
                      {guestsCount}
                    </span>
                    <span className="text-xl">🪑</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGuestsCount((prev) => Math.min(20, prev + 1))}
                    disabled={guestsCount >= 20}
                    className="w-12 h-12 rounded-2xl bg-[#006633] text-white font-black text-xl flex items-center justify-center hover:bg-[#00552B] disabled:opacity-40 cursor-pointer transition-all active:scale-95 shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Seating Area Selection */}
              <div className="space-y-3">
                <label className="font-heading font-black text-sm text-[#2D2D2D] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFCC00]" />
                  <span>{t('seatingAreaChoice')}</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {seatingOptions.map((opt) => {
                    const isSelected = seatingArea === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSeatingArea(opt.id)}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/70 border-[#006633] ring-1 ring-[#006633] shadow-xs'
                            : 'bg-white border-[#F0EDE8] hover:bg-[#F7F5F0]'
                        }`}
                      >
                        <span className="text-2xl shrink-0 mt-0.5">{opt.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-[#2D2D2D]">
                            {language === 'fr' ? opt.labelFR : opt.labelEN}
                          </p>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {language === 'fr' ? opt.descFR : opt.descEN}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Guest Details & Occasion */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Occasion Tags */}
              <div className="space-y-2.5">
                <label className="font-heading font-black text-xs sm:text-sm text-[#2D2D2D] flex items-center gap-1.5">
                  <PartyPopper className="w-4 h-4 text-[#E8702A]" />
                  <span>{t('specialNotesOccasion')}</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {occasions.map((occ) => {
                    const isSelected = occasion === occ.labelFR;
                    return (
                      <button
                        key={occ.id}
                        type="button"
                        onClick={() => setOccasion(isSelected ? '' : occ.labelFR)}
                        className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 border-[#FFCC00] text-amber-950 ring-1 ring-[#FFCC00]'
                            : 'bg-white border-[#F0EDE8] text-gray-700 hover:bg-[#F7F5F0]'
                        }`}
                      >
                        <span>{occ.emoji}</span>
                        <span className="truncate">{language === 'fr' ? occ.labelFR : occ.labelEN}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic space-y-3.5">
                <h4 className="font-heading font-black text-xs text-gray-500 uppercase tracking-wider">
                  {t('guestDetails')}
                </h4>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ex: Fatou Ndiaye"
                    className="w-full py-2.5 px-3.5 rounded-2xl border border-[#F0EDE8] bg-[#F7F5F0] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1">
                    {t('phone')} (Sénégal) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+221 77 123 45 67"
                    className="w-full py-2.5 px-3.5 rounded-2xl border border-[#F0EDE8] bg-[#F7F5F0] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="nom@exemple.sn"
                    className="w-full py-2.5 px-3.5 rounded-2xl border border-[#F0EDE8] bg-[#F7F5F0] text-xs font-bold text-[#2D2D2D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1">
                    Remarques particulières (ex: allergies, chaise bébé)
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Précisez tout souhait pour votre table..."
                    className="w-full py-2 px-3.5 rounded-2xl border border-[#F0EDE8] bg-[#F7F5F0] text-xs font-medium text-[#2D2D2D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006633] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Confirmation View */}
          {step === 4 && confirmedBooking && (
            <div className="space-y-6 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#006633] flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="font-heading font-black text-2xl text-[#2D2D2D]">
                  {t('bookingSuccessTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-sm mx-auto">
                  {t('bookingSuccessDesc')}
                </p>
              </div>

              {/* Confirmation Code Card */}
              <div className="bg-gradient-to-r from-[#006633] to-[#0A4A28] text-white p-5 rounded-[28px] shadow-artistic text-left space-y-3 border border-emerald-800">
                <div className="flex items-center justify-between pb-3 border-b border-white/15">
                  <div>
                    <span className="text-[10px] font-black text-[#FFCC00] uppercase tracking-widest">
                      {t('bookingReference')}
                    </span>
                    <p className="font-heading font-black text-xl text-white">
                      {confirmedBooking.confirmationCode}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-[#FFCC00] text-xs font-black uppercase">
                    Confirmée
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-white/70 block text-[11px]">Restaurant</span>
                    <p className="font-bold text-white truncate">{confirmedBooking.restaurantName}</p>
                    <p className="text-[11px] text-white/80">{confirmedBooking.restaurantNeighborhood}</p>
                  </div>

                  <div>
                    <span className="text-white/70 block text-[11px]">Date & Heure</span>
                    <p className="font-bold text-white">{confirmedBooking.date} à {confirmedBooking.time}</p>
                    <p className="text-[11px] text-[#FFCC00] font-bold">
                      {confirmedBooking.guestsCount} {confirmedBooking.guestsCount > 1 ? 'personnes' : 'personne'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Restaurant Contact button */}
              <a
                href={`tel:${confirmedBooking.restaurantPhone}`}
                className="w-full py-3 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-[#2D2D2D] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#EAE6DF] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#006633]" />
                <span>Appeler {confirmedBooking.restaurantName} ({confirmedBooking.restaurantPhone})</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar with Back and Next Actions */}
        <div className="bg-[#FDFBF7] p-4 sm:p-5 border-t border-[#F0EDE8] flex items-center justify-between gap-3">
          {step < 4 ? (
            <>
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-3 rounded-2xl bg-white border border-[#F0EDE8] text-gray-700 font-black text-xs hover:bg-gray-100 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{step === 1 ? 'Annuler' : t('back')}</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 py-3.5 rounded-2xl bg-[#006633] text-white font-black text-xs sm:text-sm hover:bg-[#00552B] transition-all cursor-pointer shadow-artistic active:scale-98 flex items-center justify-center gap-2"
              >
                <span>{step === 3 ? t('confirmBookingBtn') : 'Continuer'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  handleResetAndClose();
                  if (onViewMyBookings) {
                    onViewMyBookings();
                  } else {
                    setActiveTab('profile');
                  }
                }}
                className="w-full sm:flex-1 py-3.5 rounded-2xl bg-[#FFCC00] text-amber-950 font-black text-xs sm:text-sm hover:bg-yellow-300 transition-all cursor-pointer shadow-artistic active:scale-98"
              >
                {t('viewMyBookings')}
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-[#F0EDE8] text-gray-700 font-bold text-xs hover:bg-[#F7F5F0] transition-colors cursor-pointer"
              >
                {t('backToHome')}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
