import React from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { Flame, Heart, Plus, Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
  onQuickAdd?: () => void;
  layout?: 'grid' | 'horizontal';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickAdd,
  layout = 'grid',
}) => {
  const { language, addToCart, toggleFavoriteProduct, isFavoriteProduct } = useApp();
  const isFav = isFavoriteProduct(product.id);
  const name = language === 'fr' ? product.nameFR : product.nameEN;
  const desc = language === 'fr' ? product.descriptionFR : product.descriptionEN;

  const handleAddDirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.options && product.options.length > 0) {
      // If product has options, open customization modal
      onSelect();
    } else {
      addToCart({
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        product,
        restaurantId: product.restaurantId,
        restaurantName: product.restaurantName,
        quantity: 1,
        selectedOptions: [],
        unitPrice: product.price,
        totalPrice: product.price,
      });
      if (onQuickAdd) onQuickAdd();
    }
  };

  if (layout === 'horizontal') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelect}
        className="bg-white rounded-[24px] p-3 border border-[#F0EDE8] shadow-artistic hover:shadow-artistic-lg transition-all cursor-pointer flex gap-3.5 items-center justify-between"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {product.isSignature && (
              <span className="px-2 py-0.5 rounded-full bg-[#FFCC00] text-[#006633] text-[10px] font-black uppercase tracking-wider">
                Teranga Spécial
              </span>
            )}
            {product.isSpicy && (
              <span className="flex items-center text-[#E8702A] text-[10px] font-black">
                <Flame className="w-3 h-3 fill-[#E8702A] mr-0.5" />
                Pimenté
              </span>
            )}
          </div>

          <h4 className="font-bold text-sm text-[#2D2D2D] line-clamp-1">{name}</h4>
          <p className="text-xs text-gray-500 line-clamp-2 my-1 leading-snug">{desc}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-extrabold text-[#006633]">
              {product.price.toLocaleString()} FCFA
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {product.originalPrice.toLocaleString()} FCFA
              </span>
            )}
          </div>
        </div>

        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gray-100 shrink-0 shadow-xs">
          <img
            src={product.imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <button
            type="button"
            onClick={handleAddDirect}
            className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-[#006633] text-white flex items-center justify-center shadow-md hover:bg-[#004D26] cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="bg-white rounded-[32px] overflow-hidden border border-[#F0EDE8] shadow-artistic hover:shadow-artistic-lg transition-all cursor-pointer group flex flex-col justify-between"
    >
      {/* Image container */}
      <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isSignature && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFCC00] text-[#006633] text-[10px] font-black uppercase tracking-wider shadow-xs">
              <Sparkles className="w-2.5 h-2.5 fill-[#006633]" />
              Spécialité
            </span>
          )}
          {product.isSpicy && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#E8702A] text-white text-[10px] font-black shadow-xs">
              <Flame className="w-2.5 h-2.5 fill-white" />
              Pimenté
            </span>
          )}
        </div>

        {/* Favorite Heart */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteProduct(product.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs cursor-pointer hover:bg-white transition-colors"
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              isFav ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          />
        </motion.button>

        {/* Rating chip */}
        <div className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{product.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-black text-[#006633] uppercase tracking-wider truncate">
            {product.restaurantName}
          </p>
          <h4 className="font-bold text-sm text-[#2D2D2D] line-clamp-1 leading-snug my-1">
            {name}
          </h4>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {desc}
          </p>
        </div>

        {/* Price & Add to Cart button */}
        <div className="pt-3 mt-2 border-t border-[#F0EDE8] flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-[#006633]">
              {product.price.toLocaleString()} FCFA
            </div>
            {product.originalPrice && (
              <div className="text-[11px] text-gray-400 line-through">
                {product.originalPrice.toLocaleString()} FCFA
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAddDirect}
            className="w-9 h-9 rounded-2xl bg-[#006633] text-white flex items-center justify-center shadow-md hover:bg-[#004D26] cursor-pointer transition-colors"
            title="Ajouter au panier"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
