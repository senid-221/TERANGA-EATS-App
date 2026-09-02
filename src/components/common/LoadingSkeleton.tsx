import React from 'react';

export const LoadingSkeleton: React.FC<{ count?: number; type?: 'restaurant' | 'product' | 'category' }> = ({
  count = 3,
  type = 'restaurant',
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-3xl p-4 border border-gray-200/80 shadow-2xs animate-pulse"
        >
          {type === 'restaurant' ? (
            <div className="space-y-3">
              <div className="w-full h-44 bg-gray-200 rounded-2xl" />
              <div className="h-5 bg-gray-200 rounded-md w-3/4" />
              <div className="h-4 bg-gray-100 rounded-md w-1/2" />
              <div className="flex justify-between pt-2">
                <div className="h-4 bg-gray-200 rounded-md w-1/4" />
                <div className="h-4 bg-gray-200 rounded-md w-1/4" />
              </div>
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <div className="w-20 h-20 bg-gray-200 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                <div className="h-3 bg-gray-100 rounded-md w-full" />
                <div className="h-4 bg-gray-200 rounded-md w-1/3" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
