import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Primary3DButton } from '../common/Primary3DButton';
import { DeliveryAddressCard } from '../common/DeliveryAddressCard';
import { PaymentMethodCard } from '../common/PaymentMethodCard';
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck, Sparkles, Smartphone } from 'lucide-react';
import { PaymentMethod } from '../../types';
import { motion } from 'motion/react';

interface CheckoutScreenProps {
  onBack: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  onBack,
  onOrderSuccess,
}) => {
  const {
    t,
    language,
    cart,
    cartSubtotal,
    deliveryFee,
    discountAmount,
    cartTotal,
    deliveryAddress,
    createOrder,
    showToast,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wave');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  const paymentMethods: PaymentMethod[] = ['wave', 'orange_money', 'mtn', 'cash_on_delivery'];

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.streetAddress || !deliveryAddress.fullName || !deliveryAddress.phone) {
      showToast(t('fillRequiredFields'));
      return;
    }

    setIsProcessing(true);

    if (paymentMethod === 'wave') {
      setProcessingStep('Initialisation du paiement sécurisé Wave Sénégal...');
      await new Promise((r) => setTimeout(r, 1000));
      setProcessingStep('En attente de confirmation sur votre application Wave (1% sans frais)...');
      await new Promise((r) => setTimeout(r, 1200));
      setProcessingStep('Paiement Wave validé avec succès !');
    } else if (paymentMethod === 'orange_money') {
      setProcessingStep('Génération de la demande de débit Orange Money (#144#)...');
      await new Promise((r) => setTimeout(r, 1200));
      setProcessingStep('Paiement Orange Money validé !');
    } else if (paymentMethod === 'mtn') {
      setProcessingStep('Connexion au serveur MTN / Free Money...');
      await new Promise((r) => setTimeout(r, 1200));
      setProcessingStep('Paiement validé !');
    } else {
      setProcessingStep('Validation de la commande avec paiement à la livraison...');
      await new Promise((r) => setTimeout(r, 800));
    }

    const order = await createOrder(paymentMethod);
    setIsProcessing(false);
    showToast(t('orderConfirmed'));
    onOrderSuccess(order.id);
  };

  return (
    <div id="checkout-screen" className="min-h-screen bg-[#FDFBF7] pb-28 max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="w-11 h-11 rounded-2xl bg-white text-[#2D2D2D] flex items-center justify-center shadow-artistic border border-[#F0EDE8] cursor-pointer hover:bg-gray-50 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="font-heading font-black text-lg sm:text-xl text-[#2D2D2D]">
          {t('checkoutTitle')}
        </h2>

        <div className="flex items-center gap-1.5 text-[11px] font-black text-[#006633] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-[#006633]" />
          <span>SSL 256-bit</span>
        </div>
      </div>

      {/* Step 1: Delivery Address Form Card */}
      <DeliveryAddressCard />

      {/* Step 2: Payment Method Card */}
      <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EDE8]">
          <div>
            <h4 className="font-bold text-sm text-[#2D2D2D]">{t('stepPayment')}</h4>
            <p className="text-xs text-gray-500">Choisissez votre méthode de règlement</p>
          </div>
          <span className="text-[10px] font-black text-[#006633] bg-[#006633]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Sénégal Mobile Money
          </span>
        </div>

        <div className="space-y-2.5">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method}
              method={method}
              isSelected={paymentMethod === method}
              onSelect={() => setPaymentMethod(method)}
            />
          ))}
        </div>
      </div>

      {/* Step 3: Order Summary & Review */}
      <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-3">
        <h4 className="font-bold text-sm text-[#2D2D2D] pb-3 border-b border-[#F0EDE8]">
          {t('orderSummary')}
        </h4>

        <div className="space-y-2 text-xs">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-gray-700">
              <span className="truncate max-w-[240px] font-medium text-[#2D2D2D]">
                {item.quantity}x {language === 'fr' ? item.product.nameFR : item.product.nameEN}
              </span>
              <span className="font-bold text-[#2D2D2D]">{item.totalPrice.toLocaleString()} FCFA</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#F0EDE8] space-y-1.5 text-xs text-gray-500 font-medium">
          <div className="flex justify-between">
            <span>{t('subtotal')}</span>
            <span className="font-bold text-[#2D2D2D]">{cartSubtotal.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between">
            <span>{t('deliveryFee')} ({deliveryAddress.neighborhood})</span>
            <span className="font-bold text-[#2D2D2D]">{deliveryFee.toLocaleString()} FCFA</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-[#006633] font-black">
              <span>{t('discount')}</span>
              <span>-{discountAmount.toLocaleString()} FCFA</span>
            </div>
          )}
          <div className="pt-3 border-t border-[#F0EDE8] flex justify-between items-baseline">
            <span className="font-heading font-black text-base text-[#2D2D2D]">{t('total')}</span>
            <span className="font-heading font-black text-xl sm:text-2xl text-[#006633]">
              {cartTotal.toLocaleString()} FCFA
            </span>
          </div>
        </div>
      </div>

      {/* Place Order CTA Button */}
      <div className="pt-2">
        <Primary3DButton
          id="btn-place-order-confirm"
          onClick={handlePlaceOrder}
          loading={isProcessing}
          size="lg"
          icon={<Lock className="w-4 h-4" />}
        >
          {isProcessing ? processingStep || 'Traitement...' : `${t('confirmOrder')} • ${cartTotal.toLocaleString()} FCFA`}
        </Primary3DButton>
      </div>
    </div>
  );
};
