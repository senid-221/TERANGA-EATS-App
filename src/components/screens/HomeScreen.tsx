import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryCard } from '../common/CategoryCard';
import { RestaurantCard } from '../common/RestaurantCard';
import { ProductCard } from '../common/ProductCard';
import {
  Calendar,
  ChevronRight,
  Coffee,
  CupSoda,
  Flame,
  Motorbike,
  RotateCcw,
  Search,
  Sparkles,
  Ticket,
  Utensils,
  UtensilsCrossed,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Product, Restaurant } from '../../types';

interface HomeScreenProps {
  onOpenProductDetail: (product: Product) => void;
  onOpenRestaurantDetail: (restaurant: Restaurant) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenProductDetail,
  onOpenRestaurantDetail,
}) => {
  const {
    t,
    language,
    restaurants,
    products,
    categories,
    promotions,
    activeOrder,
    setActiveTab,
    setActiveScreen,
    setSelectedOrderId,
    reorder,
    orders,
    bookings,
    openBookingModal,
  } = useApp();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('senegalese');

  // Filtered products by selected category
  const categoryProducts = products.filter((p) => {
    if (selectedCategoryId === 'all') return true;
    if (selectedCategoryId === 'senegalese') {
      return p.categoryId === 'senegalese' || p.isSignature;
    }
    return p.categoryId === selectedCategoryId;
  });

  const popularDishes = products.filter((p) => p.isPopular);
  const drinkAndCoffeeDishes = products.filter(
    (p) => p.categoryId === 'cafe' || p.categoryId === 'drinks'
  );

  return (
    <div id="home-screen" className="pb-28 space-y-6">
      {/* Active Order Banner if live */}
      {activeOrder && (
        <div className="px-4 sm:px-8 pt-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              setSelectedOrderId(activeOrder.id);
              setActiveScreen('order_tracking');
            }}
            className="p-4 rounded-[28px] bg-gradient-to-r from-[#005229] to-[#006633] text-white shadow-artistic-lg flex items-center justify-between cursor-pointer group border border-emerald-800/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-[#FFCC00] radar-active shrink-0">
                <Motorbike className="w-5 h-5 text-[#FFCC00]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FFCC00]">
                    Livraison en direct
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-xs font-extrabold text-white line-clamp-1 mt-0.5">
                  {activeOrder.restaurantName} • {activeOrder.estimatedDeliveryTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-black text-[#FFCC00] group-hover:translate-x-1 transition-transform">
              <span>Suivre</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Artistic Search Bar */}
      <div className="px-4 sm:px-8">
        <div className="bg-white rounded-[32px] p-2 pl-4 border border-[#F0EDE8] shadow-artistic flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xl">🔍</span>
            <button
              id="home-search-trigger"
              type="button"
              onClick={() => setActiveTab('search')}
              className="text-left text-xs sm:text-sm text-gray-500 font-medium truncate cursor-pointer w-full"
            >
              {t('searchPlaceholder')}
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('search')}
              className="hidden sm:block px-3.5 py-2 rounded-2xl bg-[#F7F5F0] text-[#2D2D2D] text-xs font-extrabold hover:bg-[#F0EDE8] transition-colors cursor-pointer border border-[#F0EDE8]"
            >
              {t('filters')}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className="w-10 h-10 sm:w-11 sm:h-11 bg-[#006633] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#004D26] cursor-pointer transition-all active:scale-95"
              aria-label="Rechercher"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Artistic Promo Banner with Floating Pill */}
      <div className="px-4 sm:px-8 pt-2">
        <div className="relative rounded-[36px] bg-gradient-to-r from-[#006633] via-[#00552B] to-[#E8702A] text-white p-6 sm:p-8 shadow-artistic-lg flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
          {/* Floating Tag */}
          <div className="absolute -top-1 left-6 bg-[#FFCC00] text-[#006633] text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md">
            Offre Dakar Teranga
          </div>

          <div className="space-y-2 text-center sm:text-left z-10 pt-2 sm:pt-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-[#FFCC00] fill-[#FFCC00]" />
              <span>{language === 'fr' ? 'Promotion Spéciale' : 'Special Promotion'}</span>
            </div>
            <h3 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-white">
              {language === 'fr' ? '1 000 FCFA' : '1,000 FCFA'}{' '}
              <span className="text-[#FFCC00]">{language === 'fr' ? 'OFFERTS' : 'OFF'}</span>{' '}
              <span className="text-white text-base sm:text-xl font-normal block sm:inline">
                avec code <span className="font-black underline decoration-[#FFCC00]">TERANGA2025</span>
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-md leading-relaxed">
              {language === 'fr'
                ? 'Dégustez le meilleur Thiéboudienne, Café Touba et Dibi livré chaud chez vous en un éclair.'
                : 'Enjoy the best Thiéboudienne, Café Touba and Dibi delivered hot to your door in a flash.'}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('search')}
            className="z-10 px-5 py-3 rounded-2xl bg-[#FFCC00] text-[#006633] font-black text-xs sm:text-sm shadow-lg hover:bg-yellow-300 transition-all cursor-pointer shrink-0 flex items-center gap-2 active:scale-95"
          >
            <Ticket className="w-4 h-4 text-[#E8702A]" />
            <span>{language === 'fr' ? 'En profiter' : 'Claim Offer'}</span>
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Categories */}
      <div className="space-y-3">
        <div className="px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-[#006633]" />
            <h3 className="font-heading font-black text-base sm:text-lg text-[#2D2D2D]">
              {t('categoriesTitle')}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('search')}
            className="text-xs font-extrabold text-[#006633] hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>{t('viewAll')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-4 sm:px-8 flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isSelected={selectedCategoryId === cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Table Booking System Quick Banner */}
      <div className="px-4 sm:px-8">
        <div className="bg-gradient-to-r from-[#FFFDF9] via-[#FAF6EE] to-[#F3ECE0] rounded-[32px] p-4 sm:p-5 border border-[#EAE2D5] shadow-artistic flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#006633] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              🪑
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#006633] bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Nouveau • Sorties Dakar
                </span>
                {bookings.length > 0 && (
                  <span className="text-[10px] font-bold text-gray-500">
                    {bookings.filter(b => b.status === 'confirmed').length} réservation(s)
                  </span>
                )}
              </div>
              <h4 className="font-heading font-black text-sm sm:text-base text-[#2D2D2D] mt-0.5">
                {t('bookTable')}
              </h4>
              <p className="text-xs text-gray-600 truncate max-w-sm">
                {language === 'fr'
                  ? 'Réservez une table au Plateau, Almadies, Ngor et Mermoz en 1 clic'
                  : 'Reserve a table in Plateau, Almadies, Ngor & Mermoz in 1 click'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {bookings.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveScreen('bookings_list')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-white border border-[#E0D8C8] text-gray-700 font-bold text-xs hover:bg-[#F0EDE8] transition-colors cursor-pointer"
              >
                Mes tables ({bookings.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => openBookingModal()}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-[#006633] text-white font-black text-xs hover:bg-[#00552B] transition-all cursor-pointer shadow-artistic active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Réserver</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Dakar Restaurants Section */}
      <div className="space-y-3 px-4 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFCC00] fill-[#FFCC00]" />
            <h3 className="font-heading font-black text-base sm:text-lg text-[#2D2D2D]">
              {t('featuredRestaurants')}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('search')}
            className="text-xs font-extrabold text-[#006633] hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>{t('viewAll')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {restaurants.slice(0, 3).map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onClick={() => onOpenRestaurantDetail(restaurant)}
            />
          ))}
        </div>
      </div>

      {/* Senegalese Specialties & Popular Dishes */}
      <div className="space-y-3 px-4 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#E8702A] fill-[#E8702A]" />
            <h3 className="font-heading font-black text-base sm:text-lg text-[#2D2D2D]">
              {t('popularDishes')}
            </h3>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-[#F7F5F0] px-2.5 py-1 rounded-full border border-[#F0EDE8]">
            🇸🇳 Authentique Dakar
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {popularDishes.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={() => onOpenProductDetail(product)}
            />
          ))}
        </div>
      </div>

      {/* Local Drinks & Café Touba Row */}
      <div className="space-y-3 px-4 sm:px-8">
        <div className="bg-gradient-to-br from-[#00381B] via-[#004D26] to-[#006633] text-white rounded-[36px] p-5 sm:p-7 shadow-artistic-lg border border-emerald-800/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFCC00] text-amber-950 flex items-center justify-center shadow-md">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base sm:text-lg text-white">
                  {t('localDrinksCoffee')}
                </h3>
                <p className="text-xs text-emerald-200">
                  Café Touba épicé, Bissap, Bouye & Gingembre frais
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {drinkAndCoffeeDishes.slice(0, 3).map((product) => (
              <div
                key={product.id}
                onClick={() => onOpenProductDetail(product)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-3 border border-white/15 cursor-pointer flex items-center gap-3 transition-all group"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/20 ring-1 ring-white/30">
                  <img
                    src={product.imageUrl}
                    alt={product.nameFR}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white line-clamp-1">
                    {language === 'fr' ? product.nameFR : product.nameEN}
                  </h4>
                  <p className="text-[11px] text-emerald-200 line-clamp-1 my-0.5">
                    {product.restaurantName}
                  </p>
                  <p className="text-xs font-extrabold text-[#FFCC00]">
                    {product.price.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Reorder if past orders exist */}
      {orders.length > 0 && (
        <div className="space-y-3 px-4 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#006633]" />
              <h3 className="font-heading font-black text-base sm:text-lg text-[#2D2D2D]">
                {t('quickReorder')}
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-[28px] p-4 border border-[#F0EDE8] shadow-artistic flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-gray-100 ring-1 ring-gray-200">
                <img
                  src={orders[0].items[0]?.product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'}
                  alt={orders[0].restaurantName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-[#2D2D2D] truncate">
                  {orders[0].restaurantName}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  {orders[0].items.map((i) => `${i.quantity}x ${language === 'fr' ? i.product.nameFR : i.product.nameEN}`).join(', ')}
                </p>
                <p className="text-xs font-black text-[#006633] mt-0.5">
                  {orders[0].total.toLocaleString()} FCFA
                </p>
              </div>
            </div>

            <button
              onClick={() => reorder(orders[0])}
              className="px-4 py-2.5 rounded-2xl bg-[#006633] text-white text-xs font-black hover:bg-[#004D26] cursor-pointer shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('reorderBtn')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
