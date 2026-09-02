import React from 'react';
import { PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import { Banknote, CheckCircle2, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  isSelected,
  onSelect,
}) => {
  const { t } = useApp();

  const getMethodDetails = () => {
    switch (method) {
      case 'wave':
        return {
          title: t('paymentWave'),
          desc: t('paymentWaveDesc'),
          badge: '1% sans frais',
          badgeBg: 'bg-[#1DC3F2]/15 text-[#007CB0]',
          bgGradient: isSelected ? 'bg-sky-50/80 border-[#1DC3F2] shadow-artistic ring-2 ring-[#1DC3F2]/40' : 'bg-white border-[#F0EDE8] shadow-artistic',
          iconBg: 'bg-[#1DC3F2] text-white',
          renderLogo: () => (
            <div className="w-11 h-11 rounded-2xl bg-[#1DC3F2] flex items-center justify-center text-white shadow-xs font-black text-lg">
              🐧
            </div>
          ),
        };
      case 'orange_money':
        return {
          title: t('paymentOrange'),
          desc: t('paymentOrangeDesc'),
          badge: '#144# Dakar',
          badgeBg: 'bg-orange-100 text-orange-800',
          bgGradient: isSelected ? 'bg-orange-50/80 border-[#FF7900] shadow-artistic ring-2 ring-[#FF7900]/40' : 'bg-white border-[#F0EDE8] shadow-artistic',
          iconBg: 'bg-[#FF7900] text-white',
          renderLogo: () => (
            <div className="w-11 h-11 rounded-2xl bg-[#FF7900] flex items-center justify-center text-white shadow-xs font-black text-sm">
              OM
            </div>
          ),
        };
      case 'mtn':
        return {
          title: t('paymentMtn'),
          desc: t('paymentMtnDesc'),
          badge: 'MoMo / Free',
          badgeBg: 'bg-amber-100 text-amber-900',
          bgGradient: isSelected ? 'bg-amber-50/80 border-[#FFCC00] shadow-artistic ring-2 ring-[#FFCC00]/40' : 'bg-white border-[#F0EDE8] shadow-artistic',
          iconBg: 'bg-[#FFCC00] text-amber-950',
          renderLogo: () => (
            <div className="w-11 h-11 rounded-2xl bg-[#FFCC00] flex items-center justify-center text-amber-950 shadow-xs font-black text-xs">
              <Smartphone className="w-5 h-5 text-black" />
            </div>
          ),
        };
      case 'cash_on_delivery':
      default:
        return {
          title: t('paymentCash'),
          desc: t('paymentCashDesc'),
          badge: 'Espèces',
          badgeBg: 'bg-emerald-100 text-[#006633]',
          bgGradient: isSelected ? 'bg-emerald-50/80 border-[#006633] shadow-artistic ring-2 ring-[#006633]/40' : 'bg-white border-[#F0EDE8] shadow-artistic',
          iconBg: 'bg-[#006633] text-white',
          renderLogo: () => (
            <div className="w-11 h-11 rounded-2xl bg-[#006633] flex items-center justify-center text-white shadow-xs font-black">
              <Banknote className="w-5 h-5 text-[#FFCC00]" />
            </div>
          ),
        };
    }
  };

  const details = getMethodDetails();

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`w-full text-left p-4 sm:p-4.5 rounded-[28px] border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${details.bgGradient}`}
    >
      <div className="flex items-center gap-3.5">
        {details.renderLogo()}

        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-black text-sm text-[#2D2D2D]">{details.title}</h4>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${details.badgeBg}`}>
              {details.badge}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 font-medium">{details.desc}</p>
        </div>
      </div>

      <div className="shrink-0">
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected
              ? 'border-[#006633] bg-[#006633] text-white shadow-xs'
              : 'border-[#F0EDE8] bg-[#F7F5F0]'
          }`}
        >
          {isSelected && <CheckCircle2 className="w-4 h-4 fill-white text-[#006633]" />}
        </div>
      </div>
    </motion.button>
  );
};
