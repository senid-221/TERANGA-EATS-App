import React from 'react';
import { Restaurant } from '../../types';
import { useApp } from '../../context/AppContext';
import { RatingStars } from './RatingStars';
import { Clock, Heart, MapPin, Motorbike, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
  className?: string;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onClick,
  className = '',
}) => {
  const { language, toggleFavoriteRestaurant, isFavoriteRestaurant } = useApp();
  const isFav = isFavoriteRestaurant(restaurant.id);
  const desc = language === 'fr' ? restaurant.descriptionFR : restaurant.descriptionEN;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`relative bg-white rounded-[36px] overflow-hidden border border-[#F0EDE8] shadow-artistic hover:shadow-artistic-lg transition-all cursor-pointer group flex flex-col ${className}`}
      onClick={onClick}
    >
      {/* Cover Image Container */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gray-100">
        <img
          src={restaurant.coverImageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          {restaurant.isFeatured && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFCC00] text-[#006633] text-xs font-black shadow-xs uppercase tracking-wider">
              <Sparkles className="w-3 h-3 fill-[#006633]" />
              Teranga Top
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-full text-xs font-black shadow-xs uppercase tracking-wider ${
              restaurant.isOpen
                ? 'bg-[#006633] text-white'
                : 'bg-gray-800 text-gray-200'
            }`}
          >
            {restaurant.isOpen ? (language === 'fr' ? 'Ouvert' : 'Open') : (language === 'fr' ? 'Fermé' : 'Closed')}
          </span>
        </div>

        {/* Favorite Heart Button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteRestaurant(restaurant.id);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md cursor-pointer hover:bg-white transition-colors"
          aria-label="Ajouter aux favoris"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          />
        </motion.button>

        {/* Logo and Neighborhood over image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl overflow-hidden ring-2 ring-white shadow-md bg-white shrink-0 transform -rotate-2 group-hover:rotate-0 transition-transform">
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-white drop-shadow-sm">
              <h3 className="font-heading font-extrabold text-base leading-tight text-white line-clamp-1">
                {restaurant.name}
              </h3>
              <p className="text-[11px] text-gray-200 flex items-center gap-1 font-semibold">
                <MapPin className="w-3 h-3 text-[#FFCC00]" />
                {restaurant.neighborhood}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Body Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
            {desc}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {restaurant.cuisineTypes.slice(0, 3).map((cuisine, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-[#F7F5F0] border border-[#F0EDE8] text-gray-700 text-[11px] font-bold"
              >
                {cuisine}
              </span>
            ))}
          </div>
        </div>

        {/* Delivery Specs & Rating */}
        <div className="pt-3 border-t border-[#F0EDE8] flex items-center justify-between text-xs">
          <RatingStars rating={restaurant.rating} reviewCount={restaurant.reviewCount} size="sm" />

          <div className="flex items-center gap-3 text-gray-500 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {restaurant.estimatedDeliveryTime}
            </span>
            <span className="flex items-center gap-1 font-black text-[#006633]">
              <Motorbike className="w-3.5 h-3.5 text-[#006633]" />
              {restaurant.deliveryFee === 0 ? 'Gratuit' : `${restaurant.deliveryFee} FCFA`}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
