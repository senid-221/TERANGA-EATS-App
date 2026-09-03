import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { RestaurantCard } from '../common/RestaurantCard';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';
import { DakarRestaurantsMap } from '../maps/DakarRestaurantsMap';
import {
  ArrowLeft,
  Clock,
  Filter,
  Flame,
  MapPin,
  Search as SearchIcon,
  SlidersHorizontal,
  Sparkles,
  Star,
  Utensils,
  X,
  Map as MapIcon,
} from 'lucide-react';
import { Product, Restaurant } from '../../types';

interface SearchScreenProps {
  onOpenProductDetail: (product: Product) => void;
  onOpenRestaurantDetail: (restaurant: Restaurant) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onOpenProductDetail,
  onOpenRestaurantDetail,
}) => {
  const { t, language, restaurants, products, setActiveTab } = useApp();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'time' | 'price'>('popular');
  const [viewType, setViewType] = useState<'all' | 'restaurants' | 'dishes' | 'map'>('all');

  const filterChips = [
    { id: 'all', label: t('filterAll') },
    { id: 'senegalese', label: '🇸🇳 Sénégalais' },
    { id: 'rating', label: '⭐ 4.8+' },
    { id: 'fast', label: '⚡ <30 min' },
    { id: 'free_delivery', label: '🛵 Livr. 500 FCFA' },
    { id: 'drinks', label: '☕ Café & Jus' },
    { id: 'grills', label: '🔥 Dibi & Grillades' },
  ];

  // Filtered Restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((r) => {
        const matchesQuery =
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.neighborhood.toLowerCase().includes(query.toLowerCase()) ||
          r.cuisineTypes.some((c) => c.toLowerCase().includes(query.toLowerCase()));

        if (!matchesQuery) return false;

        if (activeFilter === 'senegalese') {
          return r.cuisineTypes.some((c) => c.toLowerCase().includes('sénégalais'));
        }
        if (activeFilter === 'rating') {
          return r.rating >= 4.8;
        }
        if (activeFilter === 'fast') {
          return r.estimatedDeliveryTime.includes('15') || r.estimatedDeliveryTime.includes('20');
        }
        if (activeFilter === 'free_delivery') {
          return r.deliveryFee <= 500;
        }
        if (activeFilter === 'drinks') {
          return r.cuisineTypes.some((c) => c.toLowerCase().includes('café') || c.toLowerCase().includes('boisson'));
        }
        if (activeFilter === 'grills') {
          return r.cuisineTypes.some((c) => c.toLowerCase().includes('dibi') || c.toLowerCase().includes('grillade'));
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'price') return a.deliveryFee - b.deliveryFee;
        return b.reviewCount - a.reviewCount;
      });
  }, [restaurants, query, activeFilter, sortBy]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const name = language === 'fr' ? p.nameFR : p.nameEN;
        const desc = language === 'fr' ? p.descriptionFR : p.descriptionEN;
        const matchesQuery =
          name.toLowerCase().includes(query.toLowerCase()) ||
          desc.toLowerCase().includes(query.toLowerCase()) ||
          p.restaurantName.toLowerCase().includes(query.toLowerCase());

        if (!matchesQuery) return false;

        if (activeFilter === 'senegalese') {
          return p.categoryId === 'senegalese' || p.isSignature;
        }
        if (activeFilter === 'rating') {
          return p.rating >= 4.8;
        }
        if (activeFilter === 'fast') {
          return p.prepTimeMinutes <= 15;
        }
        if (activeFilter === 'drinks') {
          return p.categoryId === 'cafe' || p.categoryId === 'drinks';
        }
        if (activeFilter === 'grills') {
          return p.categoryId === 'grills';
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'price') return a.price - b.price;
        return b.reviewCount - a.reviewCount;
      });
  }, [products, query, activeFilter, sortBy, language]);

  const totalResults = filteredRestaurants.length + filteredProducts.length;

  return (
    <div id="search-screen" className="p-4 sm:p-6 pb-28 max-w-7xl mx-auto space-y-5">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="w-12 h-12 rounded-[24px] bg-white border border-[#F0EDE8] text-[#2D2D2D] flex items-center justify-center shadow-artistic hover:bg-[#F0EDE8] cursor-pointer transition-all active:scale-95 shrink-0"
          aria-label={t('back')}
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="flex-1 flex items-center gap-3 bg-white rounded-[32px] p-2 pl-4 border border-[#F0EDE8] shadow-artistic focus-within:border-[#006633] focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
          <SearchIcon className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-[#2D2D2D] font-bold py-1.5"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-gray-400 hover:text-[#2D2D2D] rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-[#006633] text-white flex items-center justify-center shadow-xs shrink-0">
            <SearchIcon className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Filter Chips Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {filterChips.map((chip) => {
          const isActive = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#006633] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-[#F0EDE8] hover:bg-[#F7F5F0]'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* View Switcher & Sorting Bar */}
      <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
        <div className="flex items-center bg-[#F7F5F0] p-1 rounded-2xl border border-[#F0EDE8]">
          <button
            onClick={() => setViewType('all')}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              viewType === 'all' ? 'bg-white text-[#2D2D2D] shadow-xs' : 'text-gray-500'
            }`}
          >
            {t('tabAll')}
          </button>
          <button
            onClick={() => setViewType('restaurants')}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              viewType === 'restaurants' ? 'bg-white text-[#2D2D2D] shadow-xs' : 'text-gray-500'
            }`}
          >
            Restaurants ({filteredRestaurants.length})
          </button>
          <button
            onClick={() => setViewType('dishes')}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              viewType === 'dishes' ? 'bg-white text-[#2D2D2D] shadow-xs' : 'text-gray-500'
            }`}
          >
            Plats ({filteredProducts.length})
          </button>
          <button
            onClick={() => setViewType('map')}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1 ${
              viewType === 'map' ? 'bg-[#006633] text-white shadow-xs' : 'text-[#006633] hover:bg-white/60'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Carte Dakar 🗺️</span>
          </button>
        </div>

        {/* Sort selector */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-white border border-[#F0EDE8] text-[#2D2D2D] text-xs font-bold rounded-2xl px-3.5 py-2 outline-none cursor-pointer shadow-artistic"
        >
          <option value="popular">{t('sortPopular')}</option>
          <option value="rating">{t('sortRating')}</option>
          <option value="price">{t('sortPriceAsc')}</option>
        </select>
      </div>

      {/* Results Rendering */}
      {viewType === 'map' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-base text-[#2D2D2D] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#006633]" />
              <span>Carte interactive des restaurants à Dakar ({filteredRestaurants.length})</span>
            </h3>
            <span className="text-xs text-gray-500 font-bold">Cliquez sur un marqueur pour commander</span>
          </div>
          <DakarRestaurantsMap
            restaurants={filteredRestaurants}
            onSelectRestaurant={(r) => onOpenRestaurantDetail(r)}
            height="h-[480px] sm:h-[540px]"
          />
        </div>
      ) : totalResults === 0 ? (
        <EmptyState
          icon="🔍"
          title={t('noResults')}
          description={t('noResultsDesc')}
          actionText={language === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
          onAction={() => {
            setQuery('');
            setActiveFilter('all');
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Restaurants Section */}
          {(viewType === 'all' || viewType === 'restaurants') && filteredRestaurants.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading font-black text-base text-[#2D2D2D] flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#006633]" />
                <span>Restaurants à Dakar ({filteredRestaurants.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => onOpenRestaurantDetail(restaurant)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dishes & Products Section */}
          {(viewType === 'all' || viewType === 'dishes') && filteredProducts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading font-black text-base text-[#2D2D2D] flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#E8702A] fill-[#E8702A]" />
                <span>Plats & Boissons ({filteredProducts.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={() => onOpenProductDetail(product)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
