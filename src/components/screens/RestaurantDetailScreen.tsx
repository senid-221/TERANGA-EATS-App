import React, { useState } from 'react';
import { Product, Restaurant } from '../../types';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../common/ProductCard';
import { RatingStars } from '../common/RatingStars';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Heart,
  Info,
  MapPin,
  Motorbike,
  Phone,
  Share2,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { motion } from 'motion/react';

interface RestaurantDetailScreenProps {
  restaurant: Restaurant;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
}

export const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({
  restaurant,
  onBack,
  onSelectProduct,
}) => {
  const {
    t,
    language,
    products,
    toggleFavoriteRestaurant,
    isFavoriteRestaurant,
    openBookingModal,
    showToast,
  } = useApp();

  const isFav = isFavoriteRestaurant(restaurant.id);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  // Products belonging to this restaurant
  const restaurantProducts = products.filter((p) => p.restaurantId === restaurant.id);

  const tabs = [
    { id: 'all', label: t('tabAll') },
    { id: 'senegalese', label: t('tabSenegalese') },
    { id: 'grills', label: t('tabGrills') },
    { id: 'drinks', label: t('tabDrinks') },
    { id: 'desserts', label: t('tabCoffee') },
  ];

  const filteredItems = restaurantProducts.filter((p) => {
    if (selectedCategoryTab === 'all') return true;
    if (selectedCategoryTab === 'senegalese') return p.categoryId === 'senegalese' || p.categoryId === 'poulet';
    if (selectedCategoryTab === 'grills') return p.categoryId === 'grills';
    if (selectedCategoryTab === 'drinks') return p.categoryId === 'drinks' || p.categoryId === 'cafe';
    if (selectedCategoryTab === 'desserts') return p.categoryId === 'desserts' || p.categoryId === 'cafe';
    return true;
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast(language === 'fr' ? 'Lien copié dans le presse-papier !' : 'Link copied to clipboard!');
    }
  };

  return (
    <div id="restaurant-detail-screen" className="min-h-screen bg-[#FDFBF7] pb-28 max-w-5xl mx-auto">
      {/* Cover Header */}
      <div className="relative h-64 sm:h-80 w-full bg-gray-900">
        <img
          src={restaurant.coverImageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover opacity-90"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

        {/* Top Floating Buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md text-[#2D2D2D] flex items-center justify-center shadow-md hover:bg-white cursor-pointer transition-all active:scale-95 border border-white/20"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md text-[#2D2D2D] flex items-center justify-center shadow-md hover:bg-white cursor-pointer transition-all active:scale-95 border border-white/20"
              aria-label="Partager"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleFavoriteRestaurant(restaurant.id)}
              className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md text-[#2D2D2D] flex items-center justify-center shadow-md hover:bg-white cursor-pointer transition-all active:scale-95 border border-white/20"
              aria-label="Favoris"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFav ? 'fill-red-500 text-red-500' : 'text-gray-700'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Info on Cover */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-end gap-3.5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] overflow-hidden ring-4 ring-white shadow-xl bg-white shrink-0 transform -rotate-2">
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-full bg-[#006633] text-white text-xs font-black shadow-xs uppercase tracking-wider">
                  {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
                </span>
                {restaurant.isFeatured && (
                  <span className="px-3 py-1 rounded-full bg-[#FFCC00] text-[#006633] text-xs font-black flex items-center gap-1 shadow-xs uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 fill-[#006633]" />
                    Teranga Top
                  </span>
                )}
              </div>
              <h1 className="font-heading text-xl sm:text-3xl font-black text-white line-clamp-1 drop-shadow-md">
                {restaurant.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Meta Details Card */}
      <div className="px-4 sm:px-6 -mt-4 relative z-10">
        <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-3">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
            {language === 'fr' ? restaurant.descriptionFR : restaurant.descriptionEN}
          </p>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-3 border-t border-[#F0EDE8] text-xs">
            <RatingStars
              rating={restaurant.rating}
              reviewCount={restaurant.reviewCount}
              size="sm"
            />

            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{restaurant.estimatedDeliveryTime}</span>
            </div>

            <div className="flex items-center gap-1.5 font-black text-[#006633]">
              <Motorbike className="w-3.5 h-3.5 text-[#006633]" />
              <span>{restaurant.deliveryFee === 0 ? 'Gratuit' : `${restaurant.deliveryFee} FCFA`}</span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span className="truncate max-w-[200px]">{restaurant.address}</span>
            </div>

            <a
              href={`tel:${restaurant.phone}`}
              className="flex items-center gap-1.5 text-[#006633] font-black hover:underline ml-auto"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{restaurant.phone}</span>
            </a>
          </div>

          {/* Book Table Action Bar */}
          <div className="pt-3 border-t border-[#F0EDE8] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FDFBF7] -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 rounded-b-[32px]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#006633] flex items-center justify-center font-bold">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-[#2D2D2D]">
                  {t('bookTable')}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">
                  {language === 'fr' ? 'Dîner sur place, terrasse ou salon VIP' : 'Dine-in, terrace or VIP room'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openBookingModal(restaurant)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#006633] text-white font-black text-xs hover:bg-[#00552B] transition-all cursor-pointer shadow-artistic active:scale-95 flex items-center justify-center gap-2"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('bookTable')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Category Tabs Navigation */}
      <div className="sticky top-14 z-20 bg-[#FDFBF7]/95 backdrop-blur-md pt-4 pb-2 px-4 sm:px-6 border-b border-[#F0EDE8] mt-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isSelected = selectedCategoryTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategoryTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#006633] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-[#F0EDE8] hover:bg-[#F7F5F0]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Products Grid */}
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-black text-lg text-[#2D2D2D]">
            {t('restaurantMenu')} ({filteredItems.length})
          </h3>
          <span className="text-xs font-bold text-gray-500 bg-[#F7F5F0] px-3 py-1 rounded-full border border-[#F0EDE8]">
            {restaurant.neighborhood}
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-[32px] border border-[#F0EDE8] shadow-artistic">
            <p className="text-sm font-bold text-gray-600">Aucun plat dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                layout="horizontal"
                onSelect={() => onSelectProduct(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
