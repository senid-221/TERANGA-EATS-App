import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Primary3DButton } from '../common/Primary3DButton';
import { EmptyState } from '../common/EmptyState';
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartScreenProps { onProceedToCheckout: () => void; }

export const CartScreen: React.FC<CartScreenProps> = ({ onProceedToCheckout }) => {
  const { t, language, cartItems, removeFromCart, updateCartQuantity, clearCart, cartSubtotal, cartDeliveryFee, cartDiscount, appliedPromo, applyPromoCode, cartTotal, setActiveScreen, showToast } = useApp();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    if (applyPromoCode(promoInput.trim())) { setPromoInput(''); setPromoError(''); showToast('Code promo appliqué avec succès !'); }
    else setPromoError(language === 'fr' ? 'Code invalide ou expiré' : 'Invalid promo code');
  };

  if (cartItems.length === 0) return <div id="cart-screen" className="p-4 pb-24 max-w-lg mx-auto"><EmptyState icon="🛍️" title={t('emptyCartTitle')} description={t('emptyCartDesc')} actionText={t('browseRestaurants')} onAction={() => setActiveScreen('products')} /></div>;

  const restaurantName = cartItems[0]?.restaurantName || 'TerangaRestaurant';
  return <div id="cart-screen" className="p-4 sm:p-6 pb-28 max-w-2xl mx-auto space-y-4">
    <div className="bg-white rounded-[32px] p-4 sm:p-5 border border-[#F0EDE8] shadow-artistic flex items-center justify-between">
      <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-[#006633]/10 text-[#006633] flex items-center justify-center"><Utensils className="w-5 h-5" /></div><div><h3 className="font-extrabold text-sm sm:text-base text-[#2D2D2D]">{restaurantName}</h3><p className="text-xs text-gray-500 font-medium">{cartItems.reduce((s,i)=>s+i.quantity,0)} articles</p></div></div>
      <button onClick={clearCart} className="text-xs font-bold text-red-600 p-2.5 rounded-xl hover:bg-red-50">{t('clearCart')}</button>
    </div>

    <div className="bg-white rounded-[32px] p-5 border border-[#F0EDE8] shadow-artistic space-y-3"><h4 className="font-heading font-black text-sm text-[#2D2D2D] pb-3 border-b border-[#F0EDE8]">{t('orderSummary')}</h4>
      <div className="divide-y divide-[#F0EDE8]"><AnimatePresence>{cartItems.map(item => { const name = language === 'fr' ? item.product.nameFR : item.product.nameEN; return <motion.div key={item.id} layout initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:.9}} className="py-4 flex items-center gap-3">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0"><img src={item.product.imageUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>
        <div className="flex-1 min-w-0"><h5 className="font-bold text-xs sm:text-sm line-clamp-1">{name}</h5>{item.selectedOptions?.length > 0 && <p className="text-[11px] text-gray-500 line-clamp-1">{item.selectedOptions.map(o=>o.choiceName).join(', ')}</p>}<div className="text-xs font-black text-[#006633] mt-1">{item.totalPrice.toLocaleString()} FCFA</div></div>
        <div className="flex items-center gap-1 shrink-0"><div className="flex items-center bg-[#F7F5F0] rounded-xl p-0.5"><button type="button" onClick={()=>updateCartQuantity(item.id,-1)} className="w-7 h-7 rounded-lg bg-white flex items-center justify-center"><Minus className="w-3 h-3" /></button><span className="w-7 text-center text-xs font-black">{item.quantity}</span><button type="button" onClick={()=>updateCartQuantity(item.id,1)} className="w-7 h-7 rounded-lg bg-white flex items-center justify-center"><Plus className="w-3 h-3" /></button></div><button onClick={()=>removeFromCart(item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
      </motion.div>; })}</AnimatePresence></div>
    </div>

    <div className="bg-white rounded-[32px] p-5 border border-[#F0EDE8] shadow-artistic space-y-3"><div className="flex items-center gap-2"><Tag className="w-4 h-4 text-[#E8702A]" /><h4 className="font-bold text-xs uppercase">{t('promoCode')}</h4></div>{appliedPromo ? <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex justify-between"><span className="text-xs font-black text-[#006633]">{appliedPromo}</span><span className="text-xs text-gray-600">Appliqué</span></div> : <form onSubmit={handleApplyPromo} className="flex gap-2"><input value={promoInput} onChange={e=>{setPromoInput(e.target.value.toUpperCase());setPromoError('')}} placeholder={t('promoPlaceholder')} className="flex-1 px-4 py-2.5 rounded-xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-bold uppercase outline-none" /><button type="submit" className="px-4 rounded-xl bg-[#006633] text-white text-xs font-black">{t('applyPromo')}</button></form>}{promoError && <p className="text-[11px] font-bold text-red-600">{promoError}</p>}</div>

    <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-3"><div className="flex justify-between text-xs text-gray-500"><span>{t('subtotal')}</span><span className="font-bold text-[#2D2D2D]">{cartSubtotal.toLocaleString()} FCFA</span></div><div className="flex justify-between text-xs text-gray-500"><span>{t('deliveryFee')}</span><span className="font-bold text-[#2D2D2D]">{cartDeliveryFee === 0 ? 'Gratuit' : `${cartDeliveryFee.toLocaleString()} FCFA`}</span></div>{cartDiscount > 0 && <div className="flex justify-between text-xs text-[#006633] font-black"><span>{t('discount')}</span><span>-{cartDiscount.toLocaleString()} FCFA</span></div>}<div className="pt-3 border-t border-[#F0EDE8] flex justify-between items-baseline"><span className="font-heading font-black text-base">{t('total')}</span><span className="font-heading font-black text-xl sm:text-2xl text-[#006633]">{cartTotal.toLocaleString()} FCFA</span></div></div>
    <Primary3DButton id="btn-cart-checkout" onClick={onProceedToCheckout} size="lg" icon={<ArrowRight className="w-4 h-4" />}>{t('checkoutBtn')} • {cartTotal.toLocaleString()} FCFA</Primary3DButton>
  </div>;
};
