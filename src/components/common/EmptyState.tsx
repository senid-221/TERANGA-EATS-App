import React from 'react';
import { Primary3DButton } from './Primary3DButton';

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🍽️',
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-gray-200/80 shadow-2xs my-6">
      <div className="w-16 h-16 rounded-full bg-emerald-50 text-3xl flex items-center justify-center mb-4 shadow-inner">
        {typeof icon === 'string' ? icon : icon}
      </div>
      <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-600 max-w-xs mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <div className="w-full max-w-xs">
          <Primary3DButton onClick={onAction} size="sm">
            {actionText}
          </Primary3DButton>
        </div>
      )}
    </div>
  );
};
