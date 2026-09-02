import React from 'react';
import { Category } from '../../types';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import {
  Cake,
  Coffee,
  CupSoda,
  Drumstick,
  Flame,
  Ham,
  Pizza,
  Salad,
  Sandwich,
  UtensilsCrossed,
} from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onClick: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  UtensilsCrossed,
  Coffee,
  CupSoda,
  Flame,
  Drumstick,
  Sandwich,
  Pizza,
  Ham,
  Cake,
  Salad,
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  onClick,
}) => {
  const { language } = useApp();
  const IconComponent = ICON_MAP[category.iconName] || UtensilsCrossed;
  const name = language === 'fr' ? category.nameFR : category.nameEN;

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all cursor-pointer select-none text-center min-w-[80px] sm:min-w-[94px] border ${
        isSelected
          ? 'bg-[#006633]/10 border-[#006633] shadow-xs'
          : 'bg-[#F7F5F0] hover:bg-white border-[#F0EDE8] hover:border-[#006633]/40 shadow-xs'
      }`}
    >
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-xs bg-gray-100 ring-2 ring-white">
        <img
          src={category.imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div
          className={`absolute inset-0 flex items-center justify-center backdrop-blur-xs transition-colors ${
            isSelected
              ? 'bg-[#006633]/60 text-white'
              : 'bg-black/25 text-white group-hover:bg-black/35'
          }`}
        >
          <IconComponent className="w-6 h-6 drop-shadow-md" />
        </div>
      </div>

      <span
        className={`text-xs leading-tight line-clamp-2 max-w-[84px] ${
          isSelected ? 'text-[#006633] font-black' : 'text-[#2D2D2D] font-bold group-hover:text-[#006633]'
        }`}
      >
        {name}
      </span>
    </motion.button>
  );
};
