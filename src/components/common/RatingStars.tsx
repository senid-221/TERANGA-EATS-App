import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewCount,
  showText = true,
  size = 'md',
  className = '',
}) => {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center text-amber-500">
        <Star className={`${iconSize} fill-amber-400 text-amber-500`} />
      </div>
      {showText && (
        <span className={`font-bold text-gray-800 ${textSize}`}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={`text-gray-600 ${textSize}`}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
};
