import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  AppLanguage,
  AppNotification,
  CartItem,
  DakarNeighborhood,
  DeliveryAddress,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  Restaurant,
  TableBooking,
  User,
  UserRole,
} from '../types';
import { translations } from '../locales/translations';
import {
  CATEGORIES,
  DAKAR_NEIGHBORHOODS,
  DEFAULT_CUSTOMER_USER,
  ASSIGNED_DRIVER,
  INITIAL_BOOKINGS,
  PRODUCTS,
  PROMOTIONS,
  RESTAURANTS,
} from '../data/mockData';

interface AppContextType {
  // Localization
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;

  // Auth & Roles
  currentUser: User;
  setCurrentUser: (user: User) => void;
  role: UserRole;
  switchRole: (newRole: UserRole) => void;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, pass: string) => boolean;
  register: (name: string, phone: string, email: string, pass: string) => boolean;
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

  // Data & State
  restaurants: Restaurant[];
  products: Product[];
  categories: typeof CATEGORIES;
  promotions: typeof PROMOTIONS;
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

  // Orders
  orders: Order[];
  activeOrder: Order | null;
  createOrder: (paymentMethod: PaymentMethod) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  reorder: (order: Order) => void;

  // Favorites
  favoriteRestaurantIds: string[];
  favoriteProductIds: string[];
  toggleFavoriteRestaurant: (id: string) => void;
  toggleFavoriteProduct: (id: string) => void;
  isFavoriteRestaurant: (id: string) => boolean;
  isFavoriteProduct: (id: string) => boolean;

  // Notifications & Real-Time Engine
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  latestAlertNotification: AppNotification | null;
  dismissAlertNotification: () => void;
  simulateNextOrderStep: (orderId?: string) => void;
  triggerSimulatedScenario: (
    scenario:
      | 'order_accepted'
      | 'driver_arrived'
      | 'kitchen_prep'
      | 'order_delivered'
      | 'promo_dakar'
      | 'table_booked'
  ) => void;
  isAutoSimulationActive: boolean;
  toggleAutoSimulation: () => void;

  // Toast / Feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Table Bookings System
  bookings: TableBooking[];
  createBooking: (
    data: Omit<TableBooking, 'id' | 'createdAt' | 'confirmationCode' | 'status'>
  ) => TableBooking;
  cancelBooking: (bookingId: string) => void;
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
    return saved ? JSON.parse(saved) : DEFAULT_CUSTOMER_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const switchRole = (newRole: UserRole) => {
    const targetUser: User = {
      ...currentUser,
      role: newRole,
    };
    setCurrentUser(targetUser);
    localStorage.setItem('teranga_user', JSON.stringify(targetUser));
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

  const login = (emailOrPhone: string, _pass: string) => {
    let user: User;
    const saved = localStorage.getItem('teranga_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        user = {
          ...parsed,
          phone: emailOrPhone.includes('@') ? parsed.phone || '+221 77 543 21 00' : emailOrPhone,
          email: emailOrPhone.includes('@') ? emailOrPhone : (parsed.email || ''),
        };
      } catch {
        user = {
          ...DEFAULT_CUSTOMER_USER,
          phone: emailOrPhone.includes('@') ? '+221 77 543 21 00' : emailOrPhone,
          email: emailOrPhone.includes('@') ? emailOrPhone : '',
        };
      }
    } else {
      user = {
        ...DEFAULT_CUSTOMER_USER,
        id: `user-${Date.now()}`,
        phone: emailOrPhone.includes('@') ? '+221 77 543 21 00' : emailOrPhone,
        email: emailOrPhone.includes('@') ? emailOrPhone : '',
      };
    }
    setCurrentUser(user);
    localStorage.setItem('teranga_user', JSON.stringify(user));
    setIsAuthenticated(true);
    return true;
  };

  const register = (name: string, phone: string, email: string, _pass: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      fullName: name,
      phone,
      email,
      role: 'customer',
      language,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(newUser);
    localStorage.setItem('teranga_user', JSON.stringify(newUser));
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    setCurrentUser(DEFAULT_CUSTOMER_USER);
    setIsAuthenticated(false);
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

  // State data
  const [restaurants, setRestaurants] = useState<Restaurant[]>(RESTAURANTS);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const categories = CATEGORIES;
  const promotions = PROMOTIONS;

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
      // If adding from a different restaurant, notify/replace
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

  // Initial Sample Orders
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'TE-78921',
      userId: DEFAULT_CUSTOMER_USER.id,
      customerName: DEFAULT_CUSTOMER_USER.fullName,
      customerPhone: DEFAULT_CUSTOMER_USER.phone,
      restaurantId: 'chez-loutcha',
      restaurantName: 'Chez Loutcha Teranga',
      restaurantLogo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&q=80',
      restaurantPhone: '+221 33 821 03 02',
      restaurantAddress: '101 Rue Joseph Gomis, Dakar Plateau',
      driver: ASSIGNED_DRIVER,
      items: [
        {
          id: 'item-1',
          productId: 'thieboudienne-rouge',
          product: PRODUCTS[0],
          restaurantId: 'chez-loutcha',
          restaurantName: 'Chez Loutcha Teranga',
          quantity: 2,
          selectedOptions: [],
          unitPrice: 3500,
          totalPrice: 7000,
        },
        {
          id: 'item-2',
          productId: 'jus-bissap-glace',
          product: PRODUCTS[9],
          restaurantId: 'chez-loutcha',
          restaurantName: 'Chez Loutcha Teranga',
          quantity: 2,
          selectedOptions: [],
          unitPrice: 1000,
          totalPrice: 2000,
        },
      ],
      subtotal: 9000,
      deliveryFee: 500,
      discount: 1000,
      promoCode: 'TERANGA2025',
      total: 8500,
      paymentMethod: 'wave',
      paymentStatus: 'paid',
      orderStatus: 'delivering',
      deliveryAddress: {
        fullName: 'Fatou Ndiaye',
        phone: '+221 77 543 21 00',
        neighborhood: 'Dakar Plateau',
        streetAddress: '15 Avenue Hassan II, Immeuble Horizon',
        buildingInfo: '3ème étage, Porte B',
        instructions: 'Sonner à l’interphone ou appeler en bas',
      },
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      estimatedDeliveryTime: '20 min',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          noteFR: 'Commande reçue et transmise au restaurant.',
          noteEN: 'Order received and forwarded to restaurant.',
        },
        {
          status: 'accepted',
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          noteFR: 'Le chef a accepté la commande.',
          noteEN: 'The chef has confirmed your order.',
        },
        {
          status: 'preparing',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          noteFR: 'Thiéboudienne et jus de bissap en préparation.',
          noteEN: 'Thiéboudienne and juices are being prepared.',
        },
        {
          status: 'picked_up',
          timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
          noteFR: 'Amadou Diallo a récupéré votre commande.',
          noteEN: 'Amadou Diallo has picked up your package.',
        },
        {
          status: 'delivering',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          noteFR: 'Le livreur est en route vers Plateau.',
          noteEN: 'Courier is heading towards Plateau.',
        },
      ],
    },
  ]);

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

  const createOrder = (paymentMethod: PaymentMethod): Order => {
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
      driver: ASSIGNED_DRIVER,
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

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setSelectedOrderId(newOrder.id);

    // Create notification
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

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updated = {
            ...ord,
            orderStatus: status,
            deliveredAt: status === 'delivered' ? new Date().toISOString() : ord.deliveredAt,
            statusHistory: [
              ...ord.statusHistory,
              {
                status,
                timestamp: new Date().toISOString(),
                noteFR: `Statut mis à jour : ${status}`,
                noteEN: `Status updated: ${status}`,
              },
            ],
          };
          return updated;
        }
        return ord;
      })
    );
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

  // Notifications & Real-Time Simulation Engine
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      userId: DEFAULT_CUSTOMER_USER.id,
      titleFR: 'Livreur en route vers votre adresse ! 🛵',
      titleEN: 'Driver on the way to your address! 🛵',
      messageFR: 'Amadou Diallo approche de votre adresse au Plateau avec votre Thiéboudienne.',
      messageEN: 'Amadou Diallo is approaching your address in Plateau with your Thiéboudienne.',
      type: 'order',
      orderStatus: 'delivering',
      orderId: 'TE-78921',
      restaurantName: 'Chez Loutcha Teranga',
      driverName: 'Amadou Diallo',
      driverPhone: '+221 77 456 78 90',
      badgeLabelFR: 'EN ROUTE',
      badgeLabelEN: 'ON THE WAY',
      actionType: 'track_order',
      read: false,
      createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-2',
      userId: DEFAULT_CUSTOMER_USER.id,
      titleFR: 'Commande acceptée par le restaurant 👨‍🍳',
      titleEN: 'Order accepted by the restaurant 👨‍🍳',
      messageFR: 'Le chef de Chez Loutcha a validé votre commande et démarre la préparation.',
      messageEN: 'Chez Loutcha chef validated your order and started kitchen prep.',
      type: 'order',
      orderStatus: 'accepted',
      orderId: 'TE-78921',
      restaurantName: 'Chez Loutcha Teranga',
      badgeLabelFR: 'ACCEPTÉE',
      badgeLabelEN: 'ACCEPTED',
      actionType: 'track_order',
      read: true,
      createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-3',
      userId: DEFAULT_CUSTOMER_USER.id,
      titleFR: 'Offre Spéciale Dakar 🇸🇳',
      titleEN: 'Dakar Special Offer 🇸🇳',
      messageFR: 'Profitez de 1 000 FCFA offerts sur tout Dakar avec le code TERANGA2025.',
      messageEN: 'Enjoy 1,000 FCFA OFF all across Dakar with code TERANGA2025.',
      type: 'promo',
      badgeLabelFR: 'PROMO DAKAR',
      badgeLabelEN: 'DAKAR PROMO',
      actionType: 'open_promo',
      read: false,
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ]);

  const [latestAlertNotification, setLatestAlertNotification] = useState<AppNotification | null>(null);
  const [isAutoSimulationActive, setIsAutoSimulationActive] = useState(false);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast(language === 'fr' ? 'Toutes les notifications marquées comme lues' : 'All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast(language === 'fr' ? 'Historique des notifications effacé' : 'Notifications cleared');
  };

  const dismissAlertNotification = () => {
    setLatestAlertNotification(null);
  };

  const addNotification = (notifData: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notifData,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setLatestAlertNotification(newNotif);
  };

  // Auto-dismiss in-app push alert banner after 6 seconds
  useEffect(() => {
    if (latestAlertNotification) {
      const timer = setTimeout(() => {
        setLatestAlertNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [latestAlertNotification]);

  // Simulate advancing the current active order to the next step
  const simulateNextOrderStep = (orderId?: string) => {
    const targetOrder = orderId
      ? orders.find((o) => o.id === orderId)
      : activeOrder || orders[0];

    if (!targetOrder) {
      showToast(language === 'fr' ? 'Aucune commande à simuler' : 'No order to simulate');
      return;
    }

    const currentStatus = targetOrder.orderStatus;
    let nextStatus: OrderStatus = 'accepted';
    let titleFR = '';
    let titleEN = '';
    let msgFR = '';
    let msgEN = '';
    let badgeFR = '';
    let badgeEN = '';
    let actionType: AppNotification['actionType'] = 'track_order';

    switch (currentStatus) {
      case 'pending':
        nextStatus = 'accepted';
        titleFR = 'Commande acceptée par le restaurant 👨‍🍳';
        titleEN = 'Order Accepted by Restaurant 👨‍🍳';
        msgFR = `Le chef de ${targetOrder.restaurantName} a accepté votre commande #${targetOrder.id}. Préparation imminente !`;
        msgEN = `The chef at ${targetOrder.restaurantName} confirmed your order #${targetOrder.id}. Prep starting!`;
        badgeFR = 'ACCEPTÉE';
        badgeEN = 'ACCEPTED';
        break;

      case 'accepted':
        nextStatus = 'preparing';
        titleFR = 'Cuisine en pleine préparation 🍲';
        titleEN = 'Kitchen Preparing Meal 🍲';
        msgFR = `Vos plats sénégalais mijotent avec soin dans les cuisines de ${targetOrder.restaurantName}.`;
        msgEN = `Your authentic dishes are simmering with care in ${targetOrder.restaurantName} kitchens.`;
        badgeFR = 'EN CUISINE';
        badgeEN = 'PREPARING';
        break;

      case 'preparing':
        nextStatus = 'picked_up';
        titleFR = 'Commande récupérée & en route 📦';
        titleEN = 'Order Picked Up & On Way 📦';
        msgFR = `Amadou Diallo a récupéré votre commande bien chaude chez ${targetOrder.restaurantName}.`;
        msgEN = `Amadou Diallo picked up your hot food from ${targetOrder.restaurantName}.`;
        badgeFR = 'RÉCUPÉRÉE';
        badgeEN = 'PICKED UP';
        break;

      case 'ready':
      case 'assigned':
      case 'picked_up':
        nextStatus = 'delivering';
        titleFR = 'Livreur en route vers votre adresse 🛵';
        titleEN = 'Driver on the way to you 🛵';
        msgFR = `Amadou Diallo roule actuellement vers ${targetOrder.deliveryAddress.neighborhood || 'votre quartier'}. Arrivée estimée dans quelques minutes !`;
        msgEN = `Amadou Diallo is riding towards ${targetOrder.deliveryAddress.neighborhood || 'your area'}. ETA in minutes!`;
        badgeFR = 'EN ROUTE';
        badgeEN = 'ON THE WAY';
        break;

      case 'delivering':
        nextStatus = 'driver_arrived';
        titleFR = 'Livreur arrivé à votre adresse ! 📍';
        titleEN = 'Driver Arrived at your Doorstep! 📍';
        msgFR = `Amadou Diallo est arrivé en bas de votre immeuble avec votre commande #${targetOrder.id}. Vous pouvez le rejoindre ou lui répondre.`;
        msgEN = `Amadou Diallo has arrived downstairs with your order #${targetOrder.id}. Ready for handoff!`;
        badgeFR = 'ARRIVÉ 📍';
        badgeEN = 'ARRIVED 📍';
        actionType = 'call_driver';
        break;

      case 'driver_arrived':
        nextStatus = 'delivered';
        titleFR = 'Commande livrée avec succès ! 🇸🇳';
        titleEN = 'Order Successfully Delivered! 🇸🇳';
        msgFR = `Votre commande #${targetOrder.id} a été remise en mains propres. Bon appétit avec la Teranga !`;
        msgEN = `Your order #${targetOrder.id} was handed over. Enjoy the authentic Senegalese meal!`;
        badgeFR = 'LIVRÉE 🎉';
        badgeEN = 'DELIVERED 🎉';
        actionType = 'reorder';
        break;

      case 'delivered':
      case 'cancelled':
      default:
        // Reset to pending or accepted to loop simulation
        nextStatus = 'pending';
        titleFR = 'Nouvelle commande créée 🛵';
        titleEN = 'New Order Placed 🛵';
        msgFR = `Commande #${targetOrder.id} transmise avec succès à ${targetOrder.restaurantName}.`;
        msgEN = `Order #${targetOrder.id} placed at ${targetOrder.restaurantName}.`;
        badgeFR = 'NOUVELLE';
        badgeEN = 'NEW ORDER';
        break;
    }

    // Update order status
    updateOrderStatus(targetOrder.id, nextStatus);

    // Push rich notification
    addNotification({
      userId: currentUser.id,
      titleFR,
      titleEN,
      messageFR: msgFR,
      messageEN: msgEN,
      type: 'order',
      orderStatus: nextStatus,
      orderId: targetOrder.id,
      restaurantName: targetOrder.restaurantName,
      restaurantLogo: targetOrder.restaurantLogo,
      driverName: 'Amadou Diallo',
      driverPhone: '+221 77 456 78 90',
      badgeLabelFR: badgeFR,
      badgeLabelEN: badgeEN,
      actionType,
    });

    showToast(language === 'fr' ? `Statut mis à jour : ${titleFR}` : `Status updated: ${titleEN}`);
  };

  // Trigger instant specific scenarios
  const triggerSimulatedScenario = (
    scenario:
      | 'order_accepted'
      | 'driver_arrived'
      | 'kitchen_prep'
      | 'order_delivered'
      | 'promo_dakar'
      | 'table_booked'
  ) => {
    const targetOrder = activeOrder || orders[0];

    switch (scenario) {
      case 'order_accepted':
        if (targetOrder) updateOrderStatus(targetOrder.id, 'accepted');
        addNotification({
          userId: currentUser.id,
          titleFR: 'Commande acceptée par le restaurant 👨‍🍳',
          titleEN: 'Order Accepted by Restaurant 👨‍🍳',
          messageFR: `Le chef de Chez Loutcha a accepté votre commande #${targetOrder?.id || 'TE-78921'}. Préparation imminente !`,
          messageEN: `Chef confirmed order #${targetOrder?.id || 'TE-78921'}. Preparation starting!`,
          type: 'order',
          orderStatus: 'accepted',
          orderId: targetOrder?.id || 'TE-78921',
          restaurantName: 'Chez Loutcha Teranga',
          badgeLabelFR: 'ACCEPTÉE',
          badgeLabelEN: 'ACCEPTED',
          actionType: 'track_order',
        });
        break;

      case 'driver_arrived':
        if (targetOrder) updateOrderStatus(targetOrder.id, 'driver_arrived');
        addNotification({
          userId: currentUser.id,
          titleFR: 'Livreur arrivé à votre adresse ! 📍',
          titleEN: 'Driver Arrived at your Doorstep! 📍',
          messageFR: 'Amadou Diallo est en bas de votre immeuble avec votre commande bien chaude. Prêt pour la remise !',
          messageEN: 'Amadou Diallo is downstairs with your hot meal. Ready for pickup!',
          type: 'driver',
          orderStatus: 'driver_arrived',
          orderId: targetOrder?.id || 'TE-78921',
          restaurantName: 'Chez Loutcha Teranga',
          driverName: 'Amadou Diallo',
          driverPhone: '+221 77 456 78 90',
          badgeLabelFR: 'ARRIVÉ 📍',
          badgeLabelEN: 'ARRIVED 📍',
          actionType: 'call_driver',
        });
        break;

      case 'kitchen_prep':
        if (targetOrder) updateOrderStatus(targetOrder.id, 'preparing');
        addNotification({
          userId: currentUser.id,
          titleFR: 'Cuisine en pleine préparation 🍲',
          titleEN: 'Kitchen Preparing Meal 🍲',
          messageFR: 'Vos délicieux plats sénégalais sont sur le feu chez Chez Loutcha.',
          messageEN: 'Your delicious dishes are being cooked at Chez Loutcha.',
          type: 'order',
          orderStatus: 'preparing',
          orderId: targetOrder?.id || 'TE-78921',
          restaurantName: 'Chez Loutcha Teranga',
          badgeLabelFR: 'EN CUISINE',
          badgeLabelEN: 'COOKING',
          actionType: 'track_order',
        });
        break;

      case 'order_delivered':
        if (targetOrder) updateOrderStatus(targetOrder.id, 'delivered');
        addNotification({
          userId: currentUser.id,
          titleFR: 'Commande livrée avec succès ! 🇸🇳',
          titleEN: 'Order Delivered! 🇸🇳',
          messageFR: `Votre commande #${targetOrder?.id || 'TE-78921'} a été livrée. Régalez-vous avec la Teranga !`,
          messageEN: `Your order #${targetOrder?.id || 'TE-78921'} is delivered. Bon appétit!`,
          type: 'order',
          orderStatus: 'delivered',
          orderId: targetOrder?.id || 'TE-78921',
          restaurantName: 'Chez Loutcha Teranga',
          badgeLabelFR: 'LIVRÉE 🎉',
          badgeLabelEN: 'DELIVERED 🎉',
          actionType: 'reorder',
        });
        break;

      case 'promo_dakar':
        addNotification({
          userId: currentUser.id,
          titleFR: 'Flash Promo Dakar 🇸🇳 1 500 FCFA',
          titleEN: 'Dakar Flash Promo 🇸🇳 1,500 FCFA',
          messageFR: 'Économisez 1 500 FCFA dès 7 000 FCFA d’achat avec le code promo TERANGAFLASH.',
          messageEN: 'Save 1,500 FCFA on orders over 7,000 FCFA with promo code TERANGAFLASH.',
          type: 'promo',
          badgeLabelFR: 'FLASH PROMO',
          badgeLabelEN: 'FLASH PROMO',
          actionType: 'open_promo',
        });
        break;

      case 'table_booked':
        addNotification({
          userId: currentUser.id,
          titleFR: 'Table confirmée au Jardin Thaïlandais 🪑',
          titleEN: 'Table Confirmed at Le Jardin Thaïlandais 🪑',
          messageFR: 'Votre table pour 2 personnes en Terrasse ce soir à 20:00 est confirmée.',
          messageEN: 'Your table for 2 guests on the Terrace tonight at 20:00 is confirmed.',
          type: 'booking',
          restaurantName: 'Le Jardin Thaïlandais',
          badgeLabelFR: 'TABLE CONFIRMÉE',
          badgeLabelEN: 'BOOKING CONFIRMED',
          actionType: 'view_booking',
        });
        break;
    }
  };

  const toggleAutoSimulation = () => {
    setIsAutoSimulationActive((prev) => {
      const nextVal = !prev;
      showToast(
        language === 'fr'
          ? nextVal
            ? 'Simulation automatique activée (mises à jour toutes les 12s)'
            : 'Simulation automatique désactivée'
          : nextVal
          ? 'Auto simulation enabled (updates every 12s)'
          : 'Auto simulation disabled'
      );
      return nextVal;
    });
  };

  // Automatic ticker when isAutoSimulationActive is ON
  useEffect(() => {
    if (!isAutoSimulationActive) return;

    const interval = setInterval(() => {
      simulateNextOrderStep();
    }, 12000);

    return () => clearInterval(interval);
  }, [isAutoSimulationActive, activeOrder, orders]);

  // Table Bookings System
  const [bookings, setBookings] = useState<TableBooking[]>(() => {
    const saved = localStorage.getItem('teranga_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingRestaurant, setBookingRestaurant] = useState<Restaurant | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<TableBooking | null>(null);

  const openBookingModal = (restaurant?: Restaurant) => {
    if (restaurant) {
      setBookingRestaurant(restaurant);
    } else {
      setBookingRestaurant(restaurants[0] || null);
    }
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setBookingRestaurant(null);
  };

  const createBooking = (
    data: Omit<TableBooking, 'id' | 'createdAt' | 'confirmationCode' | 'status'>
  ): TableBooking => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newBooking: TableBooking = {
      ...data,
      id: `bk-${Date.now()}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      confirmationCode: `TRG-BK-${randomSuffix}`,
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    localStorage.setItem('teranga_bookings', JSON.stringify(updated));

    // Send in-app notification
    addNotification({
      userId: currentUser.id,
      titleFR: 'Table Réservée ! 🎉',
      titleEN: 'Table Booked! 🎉',
      messageFR: `Votre table pour ${newBooking.guestsCount} personne(s) chez ${newBooking.restaurantName} le ${newBooking.date} à ${newBooking.time} est confirmée.`,
      messageEN: `Your table for ${newBooking.guestsCount} guest(s) at ${newBooking.restaurantName} on ${newBooking.date} at ${newBooking.time} is confirmed.`,
      type: 'booking',
      bookingId: newBooking.id,
    });

    showToast(
      language === 'fr'
        ? `Table réservée chez ${newBooking.restaurantName} !`
        : `Table booked at ${newBooking.restaurantName}!`
    );

    return newBooking;
  };

  const cancelBooking = (bookingId: string) => {
    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    );
    setBookings(updated);
    localStorage.setItem('teranga_bookings', JSON.stringify(updated));
    showToast(
      language === 'fr'
        ? 'Réservation annulée avec succès'
        : 'Reservation cancelled successfully'
    );
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentUser,
        setCurrentUser,
        role: currentUser.role,
        switchRole,
        isAuthenticated,
        login,
        register,
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
        simulateNextOrderStep,
        triggerSimulatedScenario,
        isAutoSimulationActive,
        toggleAutoSimulation,
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
