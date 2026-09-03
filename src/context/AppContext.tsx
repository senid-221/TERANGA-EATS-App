import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  AppLanguage,
  AppNotification,
  CartItem,
  Category,
  Promotion,
  DakarNeighborhood,
  DeliveryAddress,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  Restaurant,
  TableBooking,
  User,
  UserRole,
} from '../types';
import { translations } from '../locales/translations';
import { DAKAR_NEIGHBORHOODS } from '../data/constants';
const GUEST_USER: User = { id: "", fullName: "Guest", role: "customer", email: "", phone: "", language: "fr", createdAt: new Date().toISOString() };
import {
  dbFetchRestaurants,
  dbFetchProducts,
  dbFetchOrders,
  dbFetchCategories,
  dbFetchPromotions,
  dbInsertOrder,
  dbUpdateOrderStatus,
  dbFetchBookings,
  dbInsertBooking,
  dbCancelBooking,
  dbUpsertProfile,
  isSupabaseConfigured,
} from '../lib/supabase';

interface AppContextType {
  // Localization
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;

  // Real Database & Auth Status
  isSupabaseConnected: boolean;
    syncData: () => Promise<void>;

  // Auth & Roles
  currentUser: User;
  setCurrentUser: (user: User) => void;
  setUserFromClerk: (clerkUserData: {
    id: string;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    photoUrl?: string | null;
  }) => void;
  role: UserRole;
  switchRole: (newRole: UserRole) => void;
  isAuthenticated: boolean;
  logout: () => void;

  // Navigation flow
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;

  // Delivery Address
  currentNeighborhood: DakarNeighborhood;
  setCurrentNeighborhood: (neighborhood: DakarNeighborhood) => void;
  deliveryAddress: DeliveryAddress;
  setDeliveryAddress: (address: DeliveryAddress) => void;

  // Data & State (Synced with Supabase)
  restaurants: Restaurant[];
  products: Product[];
  categories: Category[];
  promotions: Promotion[];
  toggleProductAvailability: (productId: string) => void;
  addNewProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;

  // Cart
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartDiscount: number;
  cartTotal: number;
  appliedPromo: string | null;
  applyPromoCode: (code: string) => boolean;
  cartCount: number;

  // Orders (Real Database)
  orders: Order[];
  activeOrder: Order | null;
  createOrder: (paymentMethod: PaymentMethod) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, noteFR?: string, noteEN?: string) => Promise<void>;
  reorder: (order: Order) => void;

  // Favorites
  favoriteRestaurantIds: string[];
  favoriteProductIds: string[];
  toggleFavoriteRestaurant: (id: string) => void;
  toggleFavoriteProduct: (id: string) => void;
  isFavoriteRestaurant: (id: string) => boolean;
  isFavoriteProduct: (id: string) => boolean;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  latestAlertNotification: AppNotification | null;
  dismissAlertNotification: () => void;

  // Toast / Feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Table Bookings System (Real Database)
  bookings: TableBooking[];
  createBooking: (
    data: Omit<TableBooking, 'id' | 'createdAt' | 'confirmationCode' | 'status'>
  ) => Promise<TableBooking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  isBookingModalOpen: boolean;
  bookingRestaurant: Restaurant | null;
  openBookingModal: (restaurant?: Restaurant) => void;
  closeBookingModal: () => void;
  selectedBooking: TableBooking | null;
  setSelectedBooking: (booking: TableBooking | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Locale
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('teranga_lang');
    return (saved as AppLanguage) || 'fr';
  

  });
  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('teranga_lang', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations.fr;
    let text = (langDict as Record<string, string>)[key] || key;
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      });
    }
    return text;
  };

  // Auth & Roles
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('teranga_user');
    return saved ? JSON.parse(saved) : GUEST_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('teranga_auth_session'));
  });

  const switchRole = (newRole: UserRole) => {
    const targetUser: User = {
      ...currentUser,
      role: newRole,
    };
    setCurrentUser(targetUser);
    localStorage.setItem('teranga_user', JSON.stringify(targetUser));
    dbUpsertProfile(targetUser);

    if (newRole === 'admin') {
      setActiveScreen('admin_dashboard');
    } else if (newRole === 'restaurant') {
      setActiveScreen('restaurant_dashboard');
    } else if (newRole === 'driver') {
      setActiveScreen('driver_dashboard');
    } else {
      setActiveScreen('app');
      setActiveTab('home');
    }
  };

  const setUserFromClerk = useCallback((clerkUserData: {
    id: string;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    photoUrl?: string | null;
  }) => {
    // Check if the user is the admin
    const isAdmin = 
      clerkUserData.email === 'terangaeats221@gmail.com' || 
      clerkUserData.id === 'user_3ImYJ1rEpbYsdNm1ZIQRdFKU68r';

    const updatedUser: User = {
      id: clerkUserData.id,
      fullName: clerkUserData.fullName || (isAdmin ? 'Admin Teranga' : 'Client Teranga'),
      email: clerkUserData.email || '',
      phone: clerkUserData.phone || '+221 77 000 00 00',
      photoUrl: clerkUserData.photoUrl || undefined,
      role: isAdmin ? 'admin' : (currentUser.role || 'customer'),
      language,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(updatedUser);
    
    setIsAuthenticated(true);
    localStorage.setItem('teranga_user', JSON.stringify(updatedUser));
    localStorage.setItem('teranga_auth_session', 'true');
    dbUpsertProfile(updatedUser);
  }, [currentUser.role, language]);

  const logout = () => {
    setCurrentUser(GUEST_USER);
    setIsAuthenticated(false);
    localStorage.removeItem('teranga_auth_session');
    setActiveScreen('auth');
  };

  // Navigation
  const [activeScreen, setActiveScreen] = useState<string>('splash');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Delivery Address
  const [currentNeighborhood, setCurrentNeighborhood] = useState<DakarNeighborhood>(DAKAR_NEIGHBORHOODS[0]);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    fullName: currentUser.fullName,
    phone: currentUser.phone,
    neighborhood: DAKAR_NEIGHBORHOODS[0].name,
    streetAddress: '15 Avenue Hassan II, Immeuble Horizon',
    buildingInfo: '3ème étage, Porte B',
    instructions: 'Sonner à l’interphone ou appeler en bas',
    lat: DAKAR_NEIGHBORHOODS[0].lat,
    lng: DAKAR_NEIGHBORHOODS[0].lng,
  });

  // State data (Synchronized with Supabase DB)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Real Database Orders & Bookings
  const [orders, setOrders] = useState<Order[]>([]);
    
    
  

  const [bookings, setBookings] = useState<TableBooking[]>(() => {
    const local = localStorage.getItem('teranga_bookings_db');
    return [];
  });
  

  // Synchronization with Supabase
  const syncData = useCallback(async () => {
    try {
      const [fetchedRestaurants, fetchedProducts, fetchedOrders, fetchedBookings, fetchedCategories, fetchedPromotions] = await Promise.all([
        dbFetchRestaurants(),
        dbFetchProducts(),
        dbFetchOrders(currentUser.id, currentUser.role),
        dbFetchBookings(currentUser.id),
        dbFetchCategories(),
        dbFetchPromotions(),
      ]);
      setRestaurants(fetchedRestaurants);
      setProducts(fetchedProducts);
      setOrders(fetchedOrders);
      setBookings(fetchedBookings);
      setCategories(fetchedCategories);
      setPromotions(fetchedPromotions);
    } catch (e) {
      console.error('Database synchronization error:', e);
    }
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    syncData();
  }, [syncData]);

  const toggleProductAvailability = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, available: !p.available } : p))
    );
  };

  const addNewProduct = (prodData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProd, ...prev]);
  };

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      if (prev.length > 0 && prev[0].restaurantId !== item.restaurantId) {
        showToast(
          language === 'fr'
            ? `Nouveau panier commencé chez ${item.restaurantName}`
            : `New cart started from ${item.restaurantName}`
        );
        return [item];
      }
      const existingIdx = prev.findIndex(
        (i) =>
          i.productId === item.productId &&
          JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions)
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += item.quantity;
        copy[existingIdx].totalPrice = copy[existingIdx].quantity * copy[existingIdx].unitPrice;
        return copy;
      }
      return [...prev, item];
    });
    showToast(t('addedToCartSuccess'));
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...i,
              quantity: newQty,
              totalPrice: newQty * i.unitPrice,
            };
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedPromo(null);
  };

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cartItems]);

  const cartDeliveryFee = useMemo(() => {
    if (cartItems.length === 0) return 0;
    return currentNeighborhood.deliveryFee;
  }, [cartItems, currentNeighborhood]);

  const cartDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    const promo = promotions.find((p) => p.code === appliedPromo);
    if (!promo) return 0;
    if (promo.discountType === 'fixed') {
      return promo.discountValue;
    }
    return Math.round((cartSubtotal * promo.discountValue) / 100);
  }, [appliedPromo, promotions, cartSubtotal]);

  const cartTotal = useMemo(() => {
    if (cartItems.length === 0) return 0;
    return Math.max(0, cartSubtotal + cartDeliveryFee - cartDiscount);
  }, [cartItems, cartSubtotal, cartDeliveryFee, cartDiscount]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const applyPromoCode = (code: string): boolean => {
    const promo = promotions.find((p) => p.code.toUpperCase() === code.trim().toUpperCase());
    if (promo && promo.active && cartSubtotal >= promo.minOrderValue) {
      setAppliedPromo(promo.code);
      showToast(t('promoApplied', { amount: promo.discountValue }));
      return true;
    }
    showToast(t('invalidPromo'));
    return false;
  };

  const activeOrder = useMemo(() => {
    return (
      orders.find(
        (o) =>
          o.orderStatus !== 'delivered' &&
          o.orderStatus !== 'cancelled' &&
          (o.userId === currentUser.id || currentUser.role !== 'customer')
      ) || null
    );
  }, [orders, currentUser]);

  // Real Database Order Creation
  const createOrder = async (paymentMethod: PaymentMethod): Promise<Order> => {
    const firstItem = cartItems[0];
    const restaurant = restaurants.find((r) => r.id === firstItem.restaurantId) || restaurants[0];

    const newOrder: Order = {
      id: `TE-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: currentUser.id,
      customerName: deliveryAddress.fullName || currentUser.fullName,
      customerPhone: deliveryAddress.phone || currentUser.phone,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantLogo: restaurant.logoUrl,
      restaurantPhone: restaurant.phone,
      restaurantAddress: restaurant.address,
      items: [...cartItems],
      subtotal: cartSubtotal,
      deliveryFee: cartDeliveryFee,
      discount: cartDiscount,
      promoCode: appliedPromo || undefined,
      total: cartTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'cash_pending' : 'paid',
      orderStatus: 'pending',
      deliveryAddress: { ...deliveryAddress },
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: currentNeighborhood.deliveryTimeEstimate,
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          noteFR: 'Commande transmise avec succès au restaurant.',
          noteEN: 'Order successfully sent to the restaurant.',
        },
      ],
    };

    // Update state & persist to Supabase
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setSelectedOrderId(newOrder.id);
    await dbInsertOrder(newOrder);

    // Create In-App notification
    addNotification({
      userId: currentUser.id,
      titleFR: 'Commande Confirmée ! 🛵',
      titleEN: 'Order Confirmed! 🛵',
      messageFR: `Votre commande ${newOrder.id} chez ${newOrder.restaurantName} est en cours.`,
      messageEN: `Your order ${newOrder.id} at ${newOrder.restaurantName} is in progress.`,
      type: 'order',
      orderId: newOrder.id,
    });
    return newOrder;
  };

  // Real Database Status Update
  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    noteFR?: string,
    noteEN?: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            orderStatus: status,
            deliveredAt: status === 'delivered' ? new Date().toISOString() : ord.deliveredAt,
            statusHistory: [
              ...ord.statusHistory,
              {
                status,
                timestamp: new Date().toISOString(),
                noteFR: noteFR || `Statut mis à jour : ${status}`,
                noteEN: noteEN || `Status updated: ${status}`,
              },
            ],
          };
        }
        return ord;
      })
    );
    await dbUpdateOrderStatus(orderId, status, noteFR, noteEN);
  };

  const reorder = (order: Order) => {
    setCartItems(order.items);
    setActiveScreen('app');
    setActiveTab('cart');
    showToast(
      language === 'fr'
        ? 'Articles réajoutés à votre panier !'
        : 'Items added back to your cart!'
    );
  };

  // Favorites
  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState<string[]>(['chez-loutcha']);
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([
    'thieboudienne-rouge',
    'cafe-touba-authentique',
  ]);

  const toggleFavoriteRestaurant = (id: string) => {
    setFavoriteRestaurantIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleFavoriteProduct = (id: string) => {
    setFavoriteProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isFavoriteRestaurant = (id: string) => favoriteRestaurantIds.includes(id);
  const isFavoriteProduct = (id: string) => favoriteProductIds.includes(id);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-welcome',
      userId: currentUser.id,
      titleFR: 'Bienvenue sur Teranga Eats Dakar ! 🇸🇳',
      titleEN: 'Welcome to Teranga Eats Dakar! 🇸🇳',
      messageFR: 'Commandez le meilleur de la gastronomie sénégalaise livré chaud à votre porte.',
      messageEN: 'Order the best of Senegalese cuisine delivered hot to your doorstep.',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [latestAlertNotification, setLatestAlertNotification] = useState<AppNotification | null>(null);

  const addNotification = (notifData: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notifData,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setLatestAlertNotification(newNotif);
  };

  const dismissAlertNotification = () => {
    setLatestAlertNotification(null);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast(t('allNotificationsMarkedRead'));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Table Bookings (Real Database)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingRestaurant, setBookingRestaurant] = useState<Restaurant | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<TableBooking | null>(null);

  const openBookingModal = (restaurant?: Restaurant) => {
    setBookingRestaurant(restaurant || restaurants[0] || null);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  const createBooking = async (
    data: Omit<TableBooking, 'id' | 'createdAt' | 'confirmationCode' | 'status'>
  ): Promise<TableBooking> => {
    const randomCode = `TB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: TableBooking = {
      ...data,
      id: `booking-${Date.now()}`,
      confirmationCode: randomCode,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    await dbInsertBooking(newBooking);

    addNotification({
      userId: currentUser.id,
      titleFR: 'Table Réservée avec Succès ! 🍽️',
      titleEN: 'Table Reserved Successfully! 🍽️',
      messageFR: `Votre table pour ${newBooking.guestsCount} personne(s) chez ${newBooking.restaurantName} est confirmée (${newBooking.date} à ${newBooking.time}).`,
      messageEN: `Your table for ${newBooking.guestsCount} guest(s) at ${newBooking.restaurantName} is confirmed (${newBooking.date} at ${newBooking.time}).`,
      type: 'booking',
      bookingId: newBooking.id,
    });
    return newBooking;
  };

  const cancelBooking = async (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
    );
    await dbCancelBooking(bookingId);
    showToast(
      language === 'fr'
        ? 'Réservation annulée avec succès.'
        : 'Reservation successfully cancelled.'
    );
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isSupabaseConnected: isSupabaseConfigured,
                syncData,
        currentUser,
        setCurrentUser,
                role: currentUser.role,
        switchRole,
        isAuthenticated,
        logout,
        activeScreen,
        setActiveScreen,
        activeTab,
        setActiveTab,
        selectedRestaurant,
        setSelectedRestaurant,
        selectedProduct,
        setSelectedProduct,
        selectedOrderId,
        setSelectedOrderId,
        currentNeighborhood,
        setCurrentNeighborhood,
        deliveryAddress,
        setDeliveryAddress,
        restaurants,
        products,
        categories,
        promotions,
        toggleProductAvailability,
        addNewProduct,
        cartItems,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        cartDeliveryFee,
        cartDiscount,
        cartTotal,
        appliedPromo,
        applyPromoCode,
        cartCount,
        orders,
        activeOrder,
        createOrder,
        updateOrderStatus,
        reorder,
        favoriteRestaurantIds,
        favoriteProductIds,
        toggleFavoriteRestaurant,
        toggleFavoriteProduct,
        isFavoriteRestaurant,
        isFavoriteProduct,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        latestAlertNotification,
        dismissAlertNotification,
        toastMessage,
        showToast,
        bookings,
        createBooking,
        cancelBooking,
        isBookingModalOpen,
        bookingRestaurant,
        openBookingModal,
        closeBookingModal,
        selectedBooking,
        setSelectedBooking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
