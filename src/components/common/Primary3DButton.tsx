import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface Primary3DButtonProps {
  id?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'gold' | 'orange' | 'white';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Primary3DButton: React.FC<Primary3DButtonProps> = ({
  id,
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  disabled = false,
  loading = false,
  icon,
  className = '',
  type = 'button',
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'gold':
        return 'btn-3d-gold text-amber-950 font-bold';
      case 'orange':
        return 'btn-3d-orange text-white font-bold';
      case 'white':
        return 'btn-3d-white text-gray-800 font-semibold border border-gray-200';
      case 'primary':
      default:
        return 'btn-3d-primary text-white font-bold';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-3.5 text-xs rounded-xl';
      case 'lg':
        return 'py-4 px-6 text-base rounded-2xl';
      case 'md':
      default:
        return 'py-3.5 px-5 text-sm rounded-2xl';
    }
  };

  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.01 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      className={`
        relative inline-flex items-center justify-center gap-2 cursor-pointer select-none
        transition-all duration-150 outline-none
        ${getVariantClass()}
        ${getSizeClass()}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''}
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{typeof children === 'string' ? '...' : children}</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="truncate">{children}</span>
        </>
      )}
    </motion.button>
  );
};
