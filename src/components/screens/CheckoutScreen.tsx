import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Primary3DButton } from '../common/Primary3DButton';
import { DeliveryAddressCard } from '../common/DeliveryAddressCard';
import { ArrowLeft, ChevronRight, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';

interface CheckoutScreenProps { onBack: () => void; onOrderSuccess: (orderId: string) => void; }

const SELLER_WHATSAPP = '221775784158';
const SELLER_NAME = 'Teranga Eats Ltd';

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ onBack, onOrderSuccess }) => {
  const { t, language, cartItems, cartSubtotal, cartDeliveryFee, cartDiscount, cartTotal, deliveryAddress, showToast } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const email = (deliveryAddress.email || '').trim();
  const mapsQuery = [deliveryAddress.streetAddress, deliveryAddress.buildingInfo, deliveryAddress.neighborhood].filter(Boolean).join(', ');
  const hasGps = typeof deliveryAddress.lat === 'number' && typeof deliveryAddress.lng === 'number';
  const googleMapsUrl = hasGps
    ? `https://www.google.com/maps/search/?api=1&query=${deliveryAddress.lat},${deliveryAddress.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery || 'Dakar')}`;

  const validateCheckout = () => {
    if (!deliveryAddress.fullName.trim() || !deliveryAddress.phone.trim() || !deliveryAddress.streetAddress.trim()) {
      showToast(language === 'fr' ? 'Veuillez renseigner votre nom, téléphone et adresse.' : 'Please enter your name, phone number and address.');
      return false;
    }
    if (email && !/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(email)) {
      showToast(language === 'fr' ? 'Veuillez entrer une adresse email valide.' : 'Please enter a valid email address.');
      return false;
    }
    if (!deliveryAddress.neighborhood.trim()) {
      showToast(language === 'fr' ? 'Veuillez choisir votre zone à Dakar.' : 'Please choose your Dakar area.');
      return false;
    }
    if (!mapsQuery && !hasGps) {
      showToast(language === 'fr' ? 'Veuillez renseigner votre localisation.' : 'Please enter your delivery location.');
      return false;
    }
    if (!cartItems.length) {
      showToast(language === 'fr' ? 'Votre panier est vide.' : 'Your cart is empty.');
      return false;
    }
    return true;
  };

  const buildWhatsAppMessage = () => {
    const items = cartItems.map((item) => {
      const name = language === 'fr' ? item.product.nameFR : item.product.nameEN;
      const options = item.selectedOptions?.length
        ? ` (${item.selectedOptions.map((o) => o.choiceName).join(', ')})`
        : '';
      return `• ${item.quantity}x ${name}${options} — ${item.totalPrice.toLocaleString()} FCFA`;
    }).join('\n');

    return [
      `Bonjour ${SELLER_NAME},`,
      '',
      '🛍️ NOUVELLE COMMANDE TERANGA EATS',
      '',
      `👤 Nom : ${deliveryAddress.fullName.trim()}`,
      `📱 Téléphone / WhatsApp : ${deliveryAddress.phone.trim()}`,
      email ? `✉️ Email : ${email}` : '',
      `📍 Zone : ${deliveryAddress.neighborhood}`,
      `🏠 Adresse : ${deliveryAddress.streetAddress.trim()}`,
      deliveryAddress.buildingInfo?.trim() ? `🏢 Bâtiment / Repère : ${deliveryAddress.buildingInfo.trim()}` : '',
      deliveryAddress.instructions?.trim() ? `📝 Consigne : ${deliveryAddress.instructions.trim()}` : '',
      `🗺️ Google Maps : ${googleMapsUrl}`,
      '',
      '🍽️ PRODUITS :',
      items,
      '',
      `Sous-total : ${cartSubtotal.toLocaleString()} FCFA`,
      `Livraison : ${cartDeliveryFee.toLocaleString()} FCFA`,
      cartDiscount > 0 ? `Réduction : -${cartDiscount.toLocaleString()} FCFA` : '',
      `💰 Total : ${cartTotal.toLocaleString()} FCFA`,
      '',
      '💬 Paiement : négociation directement sur WhatsApp.',
      '',
      'Merci. Je souhaite confirmer cette commande et discuter du paiement et de la livraison.'
    ].filter(Boolean).join('\n');
  };

  const handleConfirmOrder = () => {
    if (!validateCheckout() || isProcessing) return;
    setIsProcessing(true);
    try {
      const message = buildWhatsAppMessage();
      const url = `https://wa.me/${SELLER_WHATSAPP}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast(language === 'fr' ? 'Ouverture de WhatsApp pour finaliser la commande.' : 'Opening WhatsApp to finalize your order.');
      onOrderSuccess(`whatsapp-${Date.now()}`);
    } finally {
      window.setTimeout(() => setIsProcessing(false), 1200);
    }
  };

  if (reviewing) {
    return (
      <div id="confirm-order-screen" className="min-h-screen bg-[#FDFBF7] pb-28 max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setReviewing(false)} disabled={isProcessing} className="w-11 h-11 rounded-2xl bg-white text-[#2D2D2D] flex items-center justify-center shadow-artistic border border-[#F0EDE8] cursor-pointer active:scale-95 transition-all"><ArrowLeft className="w-5 h-5" /></button>
          <div className="text-center"><p className="text-[10px] font-black text-[#006633] uppercase tracking-widest">2 / 2</p><h2 className="font-heading font-black text-lg sm:text-xl text-[#2D2D2D]">{language === 'fr' ? 'Confirmer la commande' : 'Confirm your order'}</h2></div>
          <MessageCircle className="w-6 h-6 text-[#006633]" />
        </div>

        <div className="bg-[#006633] text-white rounded-[30px] p-5 shadow-artistic">
          <p className="text-xs font-bold opacity-80">{language === 'fr' ? 'Total de la commande' : 'Order total'}</p>
          <p className="font-heading text-3xl font-black mt-1">{cartTotal.toLocaleString()} FCFA</p>
          <p className="text-[11px] mt-1 opacity-80">{language === 'fr' ? 'Paiement à négocier sur WhatsApp' : 'Payment negotiated on WhatsApp'}</p>
        </div>

        <section className="bg-white rounded-[30px] p-5 border border-[#F0EDE8] shadow-artistic space-y-4">
          <div className="flex items-center justify-between"><h3 className="font-black text-sm">{language === 'fr' ? 'Votre commande' : 'Your order'}</h3><span className="text-[10px] font-black text-gray-400">{cartItems.reduce((s,i)=>s+i.quantity,0)} articles</span></div>
          <div className="space-y-3">{cartItems.map(item => <div key={item.id} className="flex justify-between gap-3 text-xs"><span className="font-medium text-[#2D2D2D]">{item.quantity}x {language === 'fr' ? item.product.nameFR : item.product.nameEN}</span><span className="font-black whitespace-nowrap">{item.totalPrice.toLocaleString()} FCFA</span></div>)}</div>
          <div className="pt-3 border-t border-[#F0EDE8] space-y-1.5 text-xs text-gray-500"><div className="flex justify-between"><span>{t('subtotal')}</span><b>{cartSubtotal.toLocaleString()} FCFA</b></div><div className="flex justify-between"><span>{t('deliveryFee')}</span><b>{cartDeliveryFee.toLocaleString()} FCFA</b></div>{cartDiscount>0&&<div className="flex justify-between text-[#006633]"><span>{t('discount')}</span><b>-{cartDiscount.toLocaleString()} FCFA</b></div>}</div>
        </section>

        <section className="bg-white rounded-[30px] p-5 border border-[#F0EDE8] shadow-artistic space-y-3">
          <h3 className="font-black text-sm">{language === 'fr' ? 'Informations du client' : 'Customer information'}</h3>
          <div className="flex gap-3 text-xs"><MapPin className="w-4 h-4 text-[#006633] shrink-0" /><div><p className="font-bold text-[#2D2D2D]">{deliveryAddress.fullName} • {deliveryAddress.phone}</p><p className="text-gray-500 mt-1">{deliveryAddress.neighborhood} — {deliveryAddress.streetAddress}</p>{email&&<p className="text-gray-500">{email}</p>}{deliveryAddress.buildingInfo&&<p className="text-gray-500">{deliveryAddress.buildingInfo}</p>}<a href={googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 font-black text-[#006633]">Voir sur Google Maps <ChevronRight className="w-3 h-3" /></a></div></div>
        </section>

        <div className="bg-emerald-50 rounded-[28px] p-5 border border-emerald-200 text-sm text-[#006633] font-bold space-y-2">
          <p>💬 {language === 'fr' ? `La commande sera envoyée à ${SELLER_NAME} sur WhatsApp.` : `Your order will be sent to ${SELLER_NAME} on WhatsApp.`}</p>
          <p className="text-xs font-medium">{language === 'fr' ? 'Le paiement et les détails de livraison seront négociés directement avec le vendeur.' : 'Payment and delivery details will be negotiated directly with the seller.'}</p>
        </div>

        <Primary3DButton id="btn-confirm-order-final" onClick={handleConfirmOrder} loading={isProcessing} size="lg" icon={<MessageCircle className="w-4 h-4" />}>
          {isProcessing ? (language === 'fr' ? 'Ouverture de WhatsApp…' : 'Opening WhatsApp…') : (language === 'fr' ? 'Commander sur WhatsApp' : 'Order on WhatsApp')}
        </Primary3DButton>
      </div>
    );
  }

  return (
    <div id="checkout-screen" className="min-h-screen bg-[#FDFBF7] pb-28 max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between"><button onClick={onBack} className="w-11 h-11 rounded-2xl bg-white text-[#2D2D2D] flex items-center justify-center shadow-artistic border border-[#F0EDE8] cursor-pointer hover:bg-gray-50 active:scale-95 transition-all"><ArrowLeft className="w-5 h-5" /></button><div className="text-center"><p className="text-[10px] font-black text-[#006633] uppercase tracking-widest">1 / 2</p><h2 className="font-heading font-black text-lg sm:text-xl text-[#2D2D2D]">{t('checkoutTitle')}</h2></div><div className="flex items-center gap-1.5 text-[11px] font-black text-[#006633] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200"><ShieldCheck className="w-4 h-4" /><span>SSL 256-bit</span></div></div>
      <div className="bg-white rounded-[28px] p-4 border border-[#F0EDE8] shadow-artistic"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0"><MessageCircle className="w-5 h-5 text-[#006633]" /></div><div className="min-w-0 flex-1"><p className="font-black text-sm text-[#2D2D2D]">{language === 'fr' ? 'Commande par WhatsApp' : 'WhatsApp ordering'}</p><p className="text-xs text-gray-500 mt-1">{language === 'fr' ? `Après vos réponses, votre commande sera envoyée à ${SELLER_NAME}.` : `After your answers, your order will be sent to ${SELLER_NAME}.`}</p></div></div></div>
      <DeliveryAddressCard />
      <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-3"><h4 className="font-bold text-sm text-[#2D2D2D] pb-3 border-b border-[#F0EDE8]">{t('orderSummary')}</h4><div className="space-y-2 text-xs">{cartItems.map(item => <div key={item.id} className="flex justify-between items-center text-gray-700"><span className="truncate max-w-[240px] font-medium text-[#2D2D2D]">{item.quantity}x {language==='fr'?item.product.nameFR:item.product.nameEN}</span><span className="font-bold text-[#2D2D2D]">{item.totalPrice.toLocaleString()} FCFA</span></div>)}</div><div className="pt-3 border-t border-[#F0EDE8] space-y-1.5 text-xs text-gray-500 font-medium"><div className="flex justify-between"><span>{t('subtotal')}</span><span className="font-bold text-[#2D2D2D]">{cartSubtotal.toLocaleString()} FCFA</span></div><div className="flex justify-between"><span>{t('deliveryFee')} ({deliveryAddress.neighborhood})</span><span className="font-bold text-[#2D2D2D]">{cartDeliveryFee.toLocaleString()} FCFA</span></div>{cartDiscount>0&&<div className="flex justify-between text-[#006633] font-black"><span>{t('discount')}</span><span>-{cartDiscount.toLocaleString()} FCFA</span></div>}<div className="pt-3 border-t border-[#F0EDE8] flex justify-between items-baseline"><span className="font-heading font-black text-base text-[#2D2D2D]">{t('total')}</span><span className="font-heading font-black text-xl sm:text-2xl text-[#006633]">{cartTotal.toLocaleString()} FCFA</span></div></div></div>
      <Primary3DButton id="btn-review-order" onClick={() => { if (validateCheckout()) setReviewing(true); }} size="lg" icon={<ChevronRight className="w-4 h-4" />}>{language === 'fr' ? 'Vérifier la commande' : 'Review order'}</Primary3DButton>
    </div>
  );
};