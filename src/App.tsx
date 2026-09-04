import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from './components/screens/SplashScreen';
import { LanguageScreen } from './components/screens/LanguageScreen';
import { ProductsScreen } from './components/screens/ProductsScreen';
import { CartScreen } from './components/screens/CartScreen';
import { CheckoutScreen } from './components/screens/CheckoutScreen';
import { OrderConfirmationScreen } from './components/screens/OrderConfirmationScreen';
import { OrderTrackingScreen } from './components/screens/OrderTrackingScreen';
import { AdminGate } from './components/auth/AdminGate';

const MainAppContent: React.FC = () => {
  const { activeScreen, setActiveScreen, selectedOrderId, orders, language } = useApp();
  const [confirmationOrderId, setConfirmationOrderId] = useState<string | null>(selectedOrderId);

  if (window.location.pathname.replace(/\/$/, '') === '/admin') return <AdminGate />;
  if (activeScreen === 'splash') return <SplashScreen />;
  if (activeScreen === 'language') return <LanguageScreen />;
  if (activeScreen === 'cart') return <CartScreen onProceedToCheckout={() => setActiveScreen('checkout')} />;
  if (activeScreen === 'checkout') return <CheckoutScreen onBack={() => setActiveScreen('cart')} onOrderSuccess={(id) => { setConfirmationOrderId(id); setActiveScreen('confirmation'); }} />;
  if (activeScreen === 'confirmation' && confirmationOrderId) return <OrderConfirmationScreen orderId={confirmationOrderId} onTrackOrder={() => setActiveScreen('tracking')} onBackHome={() => setActiveScreen('products')} />;
  if (activeScreen === 'tracking' && confirmationOrderId) {
    const trackedOrder = orders.find((order) => order.id === confirmationOrderId);
    if (trackedOrder) return <OrderTrackingScreen orderId={confirmationOrderId} onBack={() => setActiveScreen('confirmation')} />;
  }

  return <ProductsScreen onOpenCart={() => setActiveScreen('cart')} />;
};

export default function App() {
  return <AppProvider><MainAppContent /></AppProvider>;
}
