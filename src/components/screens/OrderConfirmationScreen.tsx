import React from 'react';
import { useApp } from '../../context/AppContext';
import { Primary3DButton } from '../common/Primary3DButton';
import { CheckCircle2, ChevronRight, Clock, MapPin, Motorbike, Sparkles, Utensils } from 'lucide-react';
import { motion } from 'motion/react';

interface OrderConfirmationScreenProps {
  orderId: string;
  onTrackOrder: () => void;
  onBackHome: () => void;
}

export const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({
  orderId,
  onTrackOrder,
  onBackHome,
}) => {
  const { t, language, orders } = useApp();
  const order = orders.find((o) => o.id === orderId);

  return (
    <div id="order-confirmation-screen" className="min-h-screen bg-[#FDFBF7] p-4 sm:p-6 flex flex-col justify-between max-w-lg mx-auto pb-12">
      <div className="my-auto py-6 text-center space-y-6">
        {/* Animated Celebration Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative w-24 h-24 rounded-[32px] bg-gradient-to-tr from-[#006633] to-[#0A8A48] mx-auto flex items-center justify-center text-white shadow-artistic-lg border-2 border-white"
        >
          <CheckCircle2 className="w-12 h-12 text-[#FFCC00] stroke-[2.5]" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#E8702A] text-white flex items-center justify-center shadow-md border-2 border-white"
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        </motion.div>

        {/* Heading */}
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-[#2D2D2D] mb-1.5">
            {t('orderConfirmed')} !
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto font-medium">
            {t('orderConfirmedDesc')}
          </p>
        </div>

        {/* Order Details Ticket */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[32px] p-6 border border-[#F0EDE8] shadow-artistic text-left space-y-3.5"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#F0EDE8]">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {t('orderId')}
                </span>
                <p className="font-black text-xs text-[#006633]">{order.id}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {t('estimatedArrival')}
                </span>
                <p className="font-black text-xs text-[#2D2D2D]">
                  {order.estimatedDeliveryTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#006633] flex items-center justify-center shrink-0 shadow-xs">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#2D2D2D]">{order.restaurantName}</p>
                <p className="text-[11px] text-gray-500 truncate font-medium">
                  {order.items.map((i) => `${i.quantity}x ${language === 'fr' ? i.product.nameFR : i.product.nameEN}`).join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2.5 border-t border-[#F0EDE8] text-xs text-gray-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#006633] shrink-0" />
              <span className="truncate">{order.deliveryAddress.neighborhood} — {order.deliveryAddress.streetAddress}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2.5 border-t border-[#F0EDE8]">
              <span className="text-xs font-bold text-[#2D2D2D]">Total payé</span>
              <span className="font-black text-sm text-[#006633]">
                {order.total.toLocaleString()} FCFA
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Primary3DButton
          id="btn-confirm-track"
          onClick={onTrackOrder}
          size="lg"
          icon={<Motorbike className="w-4 h-4" />}
        >
          {t('trackMyOrder')}
        </Primary3DButton>

        <button
          onClick={onBackHome}
          className="w-full py-3.5 rounded-2xl bg-white border border-[#F0EDE8] text-gray-700 font-black text-xs hover:bg-gray-50 cursor-pointer transition-all active:scale-98 shadow-xs"
        >
          {t('backToHome')}
        </button>
      </div>
    </div>
  );
};
