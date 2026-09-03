import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from './components/screens/SplashScreen';
import { LanguageScreen } from './components/screens/LanguageScreen';
import { ProductsScreen } from './components/screens/ProductsScreen';
import { AdminDashboardScreen } from './components/screens/AdminDashboardScreen';

const MainAppContent: React.FC = () => {
  const { activeScreen } = useApp();

  if (window.location.pathname.replace(/\/$/, '') === '/admin') {
    return <AdminDashboardScreen />;
  }

  if (activeScreen === 'splash') return <SplashScreen />;
  if (activeScreen === 'language') return <LanguageScreen />;

  return <ProductsScreen />;
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
