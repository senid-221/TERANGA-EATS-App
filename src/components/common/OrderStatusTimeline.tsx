import React from 'react';
import { OrderStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { Check, ChefHat, Clock, Motorbike, PackageCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  currentStatus,
  className = '',
}) => {
  const { t } = useApp();

  const steps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
    { status: 'accepted', label: t('statusConfirmed'), icon: Clock },
    { status: 'preparing', label: t('statusPreparing'), icon: ChefHat },
    { status: 'ready', label: t('statusReady'), icon: PackageCheck },
    { status: 'delivering', label: t('statusDriverOnWay'), icon: Motorbike },
    { status: 'delivered', label: t('statusDelivered'), icon: Sparkles },
  ];

  const getStatusIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
      case 'accepted':
        return 0;
      case 'preparing':
        return 1;
      case 'ready':
      case 'assigned':
        return 2;
      case 'picked_up':
      case 'delivering':
      case 'driver_arrived':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className={`w-full py-4 px-2 ${className}`}>
      {/* Progress Line */}
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute top-1/2 left-4 right-4 h-1.5 -translate-y-1/2 bg-[#F0EDE8] -z-10 rounded-full" />

        {/* Active Line Fill */}
        <motion.div
          className="absolute top-1/2 left-4 h-1.5 -translate-y-1/2 bg-[#006633] -z-10 rounded-full transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 90}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.status} className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.15 : 1 }}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? 'bg-[#006633] border-[#006633] text-white shadow-xs'
                    : isCurrent
                    ? 'bg-[#006633] border-[#FFCC00] text-white shadow-md ring-4 ring-emerald-50'
                    : 'bg-white border-[#F0EDE8] text-gray-400'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                ) : (
                  <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </motion.div>

              <span
                className={`text-[10px] sm:text-xs text-center mt-2 max-w-[64px] sm:max-w-[76px] leading-tight font-black transition-colors ${
                  isCurrent
                    ? 'text-[#006633] scale-105'
                    : isDone
                    ? 'text-[#2D2D2D]'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
