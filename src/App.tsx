import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { SplashScreen } from './components/screens/SplashScreen';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { AuthScreen } from './components/screens/AuthScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { SearchScreen } from './components/screens/SearchScreen';
import { CartScreen } from './components/screens/CartScreen';
import { CheckoutScreen } from './components/screens/CheckoutScreen';
import { OrderConfirmationScreen } from './components/screens/OrderConfirmationScreen';
import { OrderTrackingScreen } from './components/screens/OrderTrackingScreen';
import { OrdersHistoryScreen } from './components/screens/OrdersHistoryScreen';
import { FavoritesScreen } from './components/screens/FavoritesScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';
import { RestaurantDetailScreen } from './components/screens/RestaurantDetailScreen';
import { AdminDashboardScreen } from './components/screens/AdminDashboardScreen';
import { RestaurantDashboardScreen } from './components/screens/RestaurantDashboardScreen';
import { DriverDashboardScreen } from './components/screens/DriverDashboardScreen';
import { ProductDetailModal } from './components/screens/ProductDetailModal';
import { BookingsScreen } from './components/screens/BookingsScreen';
import { BookTableModal } from './components/booking/BookTableModal';
import { WhatsAppFloating } from './components/common/WhatsAppFloating';
import { InAppNotificationBanner } from './components/common/InAppNotificationBanner';
import { Product, Restaurant } from './types';
import { AnimatePresence, motion } from 'motion/react';

const MainAppContent: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    activeTab,
    setActiveTab,
    role,
    toastMessage,
    selectedOrderId,
    setSelectedOrderId,
    isBookingModalOpen,
    bookingRestaurant,
    closeBookingModal,
    openBookingModal,
  } = useApp();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  // If in Splash, Onboarding, or Auth screen
  if (activeScreen === 'splash') {
    return <SplashScreen />;
  }

  if (activeScreen === 'onboarding') {
    return <OnboardingScreen />;
  }

  if (activeScreen === 'auth') {
    return <AuthScreen />;
  }

  // If viewing a specific full-screen page
  if (activeScreen === 'restaurant_detail' && selectedRestaurant) {
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        <RestaurantDetailScreen
          restaurant={selectedRestaurant}
          onBack={() => setActiveScreen('app')}
          onSelectProduct={(product) => setSelectedProduct(product)}
        />
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
        <WhatsAppFloating />
        {/* Toast */}
        <ToastContainer message={toastMessage} />
      </div>
    );
  }

  if (activeScreen === 'checkout') {
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        <CheckoutScreen
          onBack={() => {
            setActiveScreen('app');
            setActiveTab('cart');
          }}
          onOrderSuccess={(orderId) => {
            setConfirmedOrderId(orderId);
            setSelectedOrderId(orderId);
            setActiveScreen('order_confirmation');
          }}
        />
        <WhatsAppFloating />
        <ToastContainer message={toastMessage} />
      </div>
    );
  }

  if (activeScreen === 'order_confirmation' && confirmedOrderId) {
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        <OrderConfirmationScreen
          orderId={confirmedOrderId}
          onTrackOrder={() => {
            setActiveScreen('order_tracking');
          }}
          onBackHome={() => {
            setActiveScreen('app');
            setActiveTab('home');
          }}
        />
        <WhatsAppFloating />
        <ToastContainer message={toastMessage} />
      </div>
    );
  }

  if (activeScreen === 'order_tracking' && selectedOrderId) {
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        <OrderTrackingScreen
          orderId={selectedOrderId}
          onBack={() => {
            setActiveScreen('app');
            setActiveTab('home');
          }}
        />
        <WhatsAppFloating />
        <ToastContainer message={toastMessage} />
      </div>
    );
  }

  if (activeScreen === 'bookings_list') {
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        <BookingsScreen
          onBack={() => setActiveScreen('app')}
          onOpenBookingModal={() => openBookingModal()}
        />
        <BookTableModal
          isOpen={isBookingModalOpen}
          onClose={closeBookingModal}
          initialRestaurant={bookingRestaurant}
          onViewMyBookings={() => {
            closeBookingModal();
            setActiveScreen('bookings_list');
          }}
        />
        <WhatsAppFloating />
        <ToastContainer message={toastMessage} />
      </div>
    );
  }

  // Render role dashboards if role changed to restaurant / driver / admin
  const renderMainRoleContent = () => {
    if (role === 'admin') {
      return <AdminDashboardScreen />;
    }
    if (role === 'restaurant') {
      return <RestaurantDashboardScreen />;
    }
    if (role === 'driver') {
      return <DriverDashboardScreen />;
    }

    // Customer flow by active tab
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onOpenProductDetail={(prod) => setSelectedProduct(prod)}
            onOpenRestaurantDetail={(rest) => {
              setSelectedRestaurant(rest);
              setActiveScreen('restaurant_detail');
            }}
          />
        );
      case 'search':
        return (
          <SearchScreen
            onOpenProductDetail={(prod) => setSelectedProduct(prod)}
            onOpenRestaurantDetail={(rest) => {
              setSelectedRestaurant(rest);
              setActiveScreen('restaurant_detail');
            }}
          />
        );
      case 'cart':
        return (
          <CartScreen
            onProceedToCheckout={() => setActiveScreen('checkout')}
          />
        );
      case 'favorites':
        return (
          <FavoritesScreen
            onOpenProductDetail={(prod) => setSelectedProduct(prod)}
            onOpenRestaurantDetail={(rest) => {
              setSelectedRestaurant(rest);
              setActiveScreen('restaurant_detail');
            }}
          />
        );
      case 'profile':
        return <ProfileScreen />;
      case 'orders':
        return (
          <OrdersHistoryScreen
            onSelectOrder={(orderId) => {
              setSelectedOrderId(orderId);
              setActiveScreen('order_tracking');
            }}
          />
        );
      case 'bookings':
        return (
          <BookingsScreen
            onBack={() => setActiveTab('home')}
            onOpenBookingModal={() => openBookingModal()}
          />
        );
      case 'notifications':
        return <NotificationsScreen />;
      default:
        return (
          <HomeScreen
            onOpenProductDetail={(prod) => setSelectedProduct(prod)}
            onOpenRestaurantDetail={(rest) => {
              setSelectedRestaurant(rest);
              setActiveScreen('restaurant_detail');
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Real-time In-App Push Notification Banner */}
      <InAppNotificationBanner />

      <Header />

      <main className="flex-1">
        {renderMainRoleContent()}
      </main>

      {/* Customer bottom bar */}
      <BottomNav />

      {/* WhatsApp 24/7 Floating Support (221775784158) */}
      <WhatsAppFloating />

      {/* Modal for dish customization */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Modal for table reservations */}
      <BookTableModal
        isOpen={isBookingModalOpen}
        onClose={closeBookingModal}
        initialRestaurant={bookingRestaurant}
        onViewMyBookings={() => {
          closeBookingModal();
          setActiveScreen('bookings_list');
        }}
      />

      {/* Global Toast */}
      <ToastContainer message={toastMessage} />
    </div>
  );
};

const ToastContainer: React.FC<{ message: string | null }> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto bg-gray-900/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md border border-white/10 flex items-center justify-center text-center"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
