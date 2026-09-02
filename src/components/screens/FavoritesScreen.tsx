import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RestaurantCard } from '../common/RestaurantCard';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';
import { ArrowLeft, Heart, Utensils, UtensilsCrossed } from 'lucide-react';
import { Product, Restaurant } from '../../types';

interface FavoritesScreenProps {
  onOpenProductDetail: (product: Product) => void;
  onOpenRestaurantDetail: (restaurant: Restaurant) => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  onOpenProductDetail,
  onOpenRestaurantDetail,
}) => {
  const { t, favoriteRestaurantIds, favoriteProductIds, restaurants, products, setActiveTab } = useApp();
  const [activeTab, setActiveTabFilter] = useState<'restaurants' | 'dishes'>('restaurants');

  const favoriteRestaurants = restaurants.filter((r) => favoriteRestaurantIds.includes(r.id));
  const favoriteDishes = products.filter((p) => favoriteProductIds.includes(p.id));

  return (
    <div id="favorites-screen" className="p-4 sm:p-6 pb-28 max-w-7xl mx-auto space-y-5">
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
            <h2 className="font-heading font-black text-lg sm:text-xl text-[#2D2D2D] flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <span>{t('navFavorites')}</span>
            </h2>
            <p className="text-xs text-gray-500 font-medium">Vos restaurants et plats préférés à Dakar</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#F7F5F0] p-1 rounded-2xl border border-[#F0EDE8] text-xs">
          <button
            onClick={() => setActiveTabFilter('restaurants')}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeTab === 'restaurants' ? 'bg-white text-[#2D2D2D] shadow-xs' : 'text-gray-500'
            }`}
          >
            Restaurants ({favoriteRestaurants.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('dishes')}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeTab === 'dishes' ? 'bg-white text-[#2D2D2D] shadow-xs' : 'text-gray-500'
            }`}
          >
            Plats ({favoriteDishes.length})
          </button>
        </div>
      </div>

      {activeTab === 'restaurants' ? (
        favoriteRestaurants.length === 0 ? (
          <EmptyState
            icon="❤️"
            title={t('emptyFavoritesTitle')}
            description={t('emptyFavoritesDesc')}
            actionText={t('browseRestaurants')}
            onAction={() => setActiveTab('home')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {favoriteRestaurants.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                onClick={() => onOpenRestaurantDetail(r)}
              />
            ))}
          </div>
        )
      ) : favoriteDishes.length === 0 ? (
        <EmptyState
          icon="🍲"
          title={t('emptyFavoritesTitle')}
          description={t('emptyFavoritesDesc')}
          actionText={t('browseRestaurants')}
          onAction={() => setActiveTab('home')}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {favoriteDishes.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelect={() => onOpenProductDetail(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
