import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Primary3DButton } from '../common/Primary3DButton';
import { EmptyState } from '../common/EmptyState';
import {
  ArrowRight,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Utensils,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartScreenProps {
  onProceedToCheckout: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({ onProceedToCheckout }) => {
  const {
    t,
    language,
    cart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    cartSubtotal,
    deliveryFee,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    discountAmount,
    cartTotal,
    setActiveTab,
    showToast,
  } = useApp();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const success = applyPromoCode(promoInput.trim());
    if (success) {
      setPromoInput('');
      setPromoError('');
      showToast('Code promo appliqué avec succès !');
    } else {
      setPromoError(language === 'fr' ? 'Code invalide ou expiré' : 'Invalid promo code');
    }
  };

  if (cart.length === 0) {
    return (
      <div id="cart-screen" className="p-4 pb-24 max-w-lg mx-auto">
        <EmptyState
          icon="🛍️"
          title={t('emptyCartTitle')}
          description={t('emptyCartDesc')}
          actionText={t('browseRestaurants')}
          onAction={() => setActiveTab('home')}
        />
      </div>
    );
  }

  // Restaurant name for the first item
  const restaurantName = cart[0]?.restaurantName || 'Restaurant Dakar';

  return (
    <div id="cart-screen" className="p-4 sm:p-6 pb-28 max-w-2xl mx-auto space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-[32px] p-4 sm:p-5 border border-[#F0EDE8] shadow-artistic flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#006633]/10 text-[#006633] flex items-center justify-center font-bold">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-[#2D2D2D]">{restaurantName}</h3>
            <p className="text-xs text-gray-500 font-medium">
              {cart.length} {cart.length > 1 ? 'articles' : 'article'}
            </p>
          </div>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-red-600 hover:text-red-700 p-2.5 rounded-xl hover:bg-red-50 cursor-pointer transition-colors"
        >
          {t('clearCart')}
        </button>
      </div>

      {/* Cart Items List */}
      <div className="bg-white rounded-[32px] p-5 border border-[#F0EDE8] shadow-artistic space-y-3">
        <h4 className="font-heading font-black text-sm text-[#2D2D2D] pb-3 border-b border-[#F0EDE8]">
          {t('orderSummary')}
        </h4>

        <div className="divide-y divide-[#F0EDE8]">
          <AnimatePresence>
            {cart.map((item) => {
              const name = language === 'fr' ? item.product.nameFR : item.product.nameEN;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-4 flex items-center justify-between gap-3"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 ring-1 ring-gray-100">
                    <img
                      src={item.product.imageUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs sm:text-sm text-[#2D2D2D] line-clamp-1">
                      {name}
                    </h5>

                    {/* Selected Options list */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 font-medium">
                        {item.selectedOptions.map((o) => o.choiceName).join(', ')}
                      </p>
                    )}

                    {item.specialInstructions && (
                      <p className="text-[10px] text-[#006633] font-semibold italic line-clamp-1">
                        Note: {item.specialInstructions}
                      </p>
                    )}

                    <div className="text-xs font-black text-[#006633] mt-1">
                      {item.totalPrice.toLocaleString()} FCFA
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-[#F7F5F0] rounded-xl p-0.5 border border-[#F0EDE8]">
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white text-[#2D2D2D] flex items-center justify-center text-xs font-bold hover:bg-gray-50 cursor-pointer shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-[#2D2D2D]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-white text-[#2D2D2D] flex items-center justify-center text-xs font-bold hover:bg-gray-50 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 cursor-pointer transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Promo Code Card */}
      <div className="bg-white rounded-[32px] p-5 border border-[#F0EDE8] shadow-artistic space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#E8702A]" />
          <h4 className="font-bold text-xs text-[#2D2D2D] uppercase tracking-wider">
            {t('promoCode')}
          </h4>
        </div>

        {appliedPromo ? (
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#006633]" />
              <div>
                <p className="text-xs font-black text-[#006633]">{appliedPromo.code}</p>
                <p className="text-[11px] text-gray-600">
                  {appliedPromo.discountType === 'percentage'
                    ? `-${appliedPromo.discountValue}% sur la commande`
                    : `-${appliedPromo.discountValue} FCFA de réduction`}
                </p>
              </div>
            </div>
            <button
              onClick={removePromoCode}
              className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
            >
              Retirer
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyPromo} className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value.toUpperCase());
                setPromoError('');
              }}
              placeholder={t('promoPlaceholder')}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold text-[#2D2D2D] uppercase outline-none focus:bg-white focus:border-[#006633]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#006633] text-white text-xs font-black hover:bg-[#004D26] cursor-pointer transition-colors shadow-xs"
            >
              {t('applyPromo')}
            </button>
          </form>
        )}

        {promoError && <p className="text-[11px] font-bold text-red-600">{promoError}</p>}

        <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500">
          <span>Codes démo :</span>
          <button
            type="button"
            onClick={() => setPromoInput('TERANGA2025')}
            className="font-bold text-[#006633] hover:underline cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md"
          >
            TERANGA2025 (-1 000 F)
          </button>
          <button
            type="button"
            onClick={() => setPromoInput('THIEB20')}
            className="font-bold text-[#006633] hover:underline cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md"
          >
            THIEB20 (-20%)
          </button>
        </div>
      </div>

      {/* Bill Breakdown Summary Card */}
      <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-3">
        <div className="flex justify-between text-xs text-gray-500 font-medium">
          <span>{t('subtotal')}</span>
          <span className="font-bold text-[#2D2D2D]">
            {cartSubtotal.toLocaleString()} FCFA
          </span>
        </div>

        <div className="flex justify-between text-xs text-gray-500 font-medium">
          <span>{t('deliveryFee')}</span>
          <span className="font-bold text-[#2D2D2D]">
            {deliveryFee === 0 ? 'Gratuit' : `${deliveryFee.toLocaleString()} FCFA`}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-xs text-[#006633] font-black">
            <span>{t('discount')}</span>
            <span>-{discountAmount.toLocaleString()} FCFA</span>
          </div>
        )}

        <div className="pt-3 border-t border-[#F0EDE8] flex justify-between items-baseline">
          <span className="font-heading font-black text-base text-[#2D2D2D]">
            {t('total')}
          </span>
          <span className="font-heading font-black text-xl sm:text-2xl text-[#006633]">
            {cartTotal.toLocaleString()} FCFA
          </span>
        </div>
      </div>

      {/* Sticky Proceed Button */}
      <div className="pt-2">
        <Primary3DButton
          id="btn-cart-checkout"
          onClick={onProceedToCheckout}
          size="lg"
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {t('checkoutBtn')} • {cartTotal.toLocaleString()} FCFA
        </Primary3DButton>
      </div>
    </div>
  );
};
