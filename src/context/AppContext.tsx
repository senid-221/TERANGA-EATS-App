import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { AppLanguage, AppNotification, CartItem, Category, Promotion, DakarNeighborhood, DeliveryAddress, Order, OrderStatus, PaymentMethod, Product, Restaurant, TableBooking, User, UserRole } from '../types';
import { translations } from '../locales/translations';
import { DAKAR_NEIGHBORHOODS } from '../data/constants';
import { dbFetchRestaurants, dbFetchProducts, dbFetchOrders, dbFetchCategories, dbFetchPromotions, dbUpdateOrderStatus, dbFetchBookings, dbInsertBooking, dbCancelBooking, dbUpsertProfile, isSupabaseConfigured } from '../lib/supabase';
import { saveProduct, removeProduct } from '../lib/productAdmin';

const getGuestId = () => {
  try {
    const existing = localStorage.getItem('teranga_guest_id');
    if (existing) return existing;
    const id = `guest-${crypto.randomUUID()}`;
    localStorage.setItem('teranga_guest_id', id);
    return id;
  } catch {
    return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};
const GUEST_USER: User = { id: getGuestId(), fullName: 'Guest', role: 'customer', email: '', phone: '', language: 'fr', createdAt: new Date().toISOString() };

interface AppContextType {
  language: AppLanguage; setLanguage: (lang: AppLanguage) => void; t: (key: string, params?: Record<string, string | number>) => string;
  isSupabaseConnected: boolean; syncData: () => Promise<void>;
  currentUser: User; setCurrentUser: (user: User) => void; setUserFromClerk: (data: { id: string; fullName?: string | null; email?: string | null; phone?: string | null; photoUrl?: string | null }) => void; role: UserRole; switchRole: (newRole: UserRole) => void; isAuthenticated: boolean; logout: () => void;
  activeScreen: string; setActiveScreen: (screen: string) => void; activeTab: string; setActiveTab: (tab: string) => void; selectedRestaurant: Restaurant | null; setSelectedRestaurant: (restaurant: Restaurant | null) => void; selectedProduct: Product | null; setSelectedProduct: (product: Product | null) => void; selectedOrderId: string | null; setSelectedOrderId: (id: string | null) => void;
  currentNeighborhood: DakarNeighborhood; setCurrentNeighborhood: (n: DakarNeighborhood) => void; deliveryAddress: DeliveryAddress; setDeliveryAddress: (a: DeliveryAddress) => void;
  restaurants: Restaurant[]; products: Product[]; categories: Category[]; promotions: Promotion[]; toggleProductAvailability: (id: string) => Promise<void>; addNewProduct: (p: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>; updateProduct: (p: Product) => Promise<boolean>; deleteProduct: (id: string) => Promise<boolean>;
  cartItems: CartItem[]; addToCart: (item: CartItem) => void; removeFromCart: (id: string) => void; updateCartQuantity: (id: string, delta: number) => void; clearCart: () => void; cartSubtotal: number; cartDeliveryFee: number; cartDiscount: number; cartTotal: number; appliedPromo: string | null; applyPromoCode: (code: string) => boolean; cartCount: number;
  orders: Order[]; activeOrder: Order | null; createOrder: (paymentMethod: PaymentMethod) => Promise<Order>; updateOrderStatus: (id: string, status: OrderStatus, noteFR?: string, noteEN?: string) => Promise<void>; reorder: (order: Order) => void;
  favoriteRestaurantIds: string[]; favoriteProductIds: string[]; toggleFavoriteRestaurant: (id: string) => void; toggleFavoriteProduct: (id: string) => void; isFavoriteRestaurant: (id: string) => boolean; isFavoriteProduct: (id: string) => boolean;
  notifications: AppNotification[]; unreadNotificationsCount: number; markNotificationAsRead: (id: string) => void; markAllNotificationsAsRead: () => void; deleteNotification: (id: string) => void; clearAllNotifications: () => void; addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void; latestAlertNotification: AppNotification | null; dismissAlertNotification: () => void;
  toastMessage: string | null; showToast: (msg: string) => void;
  bookings: TableBooking[]; createBooking: (data: Omit<TableBooking, 'id' | 'createdAt' | 'confirmationCode' | 'status'>) => Promise<TableBooking>; cancelBooking: (id: string) => Promise<void>; isBookingModalOpen: boolean; bookingRestaurant: Restaurant | null; openBookingModal: (r?: Restaurant) => void; closeBookingModal: () => void; selectedBooking: TableBooking | null; setSelectedBooking: (b: TableBooking | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => (localStorage.getItem('teranga_lang') as AppLanguage) || 'fr');
  const setLanguage = (lang: AppLanguage) => { setLanguageState(lang); localStorage.setItem('teranga_lang', lang); };
  const t = (key: string, params?: Record<string, string | number>) => { const dict = translations[language] || translations.fr; let text = (dict as Record<string, string>)[key] || key; Object.entries(params || {}).forEach(([k, v]) => { text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)); }); return text; };
  const [currentUser, setCurrentUser] = useState<User>(() => { const s = localStorage.getItem('teranga_user'); try { return s ? JSON.parse(s) : GUEST_USER; } catch { return GUEST_USER; } });
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('teranga_auth_session')));
  const switchRole = (newRole: UserRole) => { if (newRole !== 'customer') return; const u = { ...currentUser, role: 'customer' as UserRole }; setCurrentUser(u); localStorage.setItem('teranga_user', JSON.stringify(u)); };
  const setUserFromClerk = useCallback((data: { id: string; fullName?: string | null; email?: string | null; phone?: string | null; photoUrl?: string | null }) => { const isAdmin = data.email?.toLowerCase() === 'rw@akaziconnect.com'; const u: User = { id: data.id, fullName: data.fullName || (isAdmin ? 'Admin Teranga' : 'Client Teranga'), email: data.email || '', phone: data.phone || '', photoUrl: data.photoUrl || undefined, role: isAdmin ? 'admin' : 'customer', language, createdAt: new Date().toISOString() }; setCurrentUser(u); setIsAuthenticated(true); localStorage.setItem('teranga_user', JSON.stringify(u)); localStorage.setItem('teranga_auth_session', 'true'); void dbUpsertProfile(u); }, [language]);
  const logout = () => { setCurrentUser(GUEST_USER); setIsAuthenticated(false); localStorage.removeItem('teranga_auth_session'); setActiveScreen('splash'); };
  const [activeScreen, setActiveScreen] = useState('splash'); const [activeTab, setActiveTab] = useState('home'); const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null); const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [currentNeighborhood, setCurrentNeighborhood] = useState<DakarNeighborhood>(DAKAR_NEIGHBORHOODS[0]);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({ fullName: currentUser.fullName, phone: currentUser.phone, neighborhood: DAKAR_NEIGHBORHOODS[0].name, streetAddress: '', buildingInfo: '', instructions: '', lat: DAKAR_NEIGHBORHOODS[0].lat, lng: DAKAR_NEIGHBORHOODS[0].lng });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]); const [products, setProducts] = useState<Product[]>([]); const [categories, setCategories] = useState<Category[]>([]); const [promotions, setPromotions] = useState<Promotion[]>([]); const [orders, setOrders] = useState<Order[]>([]); const [bookings, setBookings] = useState<TableBooking[]>([]);

  const syncData = useCallback(async () => {
    const adminRoute = window.location.pathname.replace(/\/$/, '') === '/admin';
    const [r, p, c, pr] = await Promise.all([dbFetchRestaurants(), dbFetchProducts(), dbFetchCategories(), dbFetchPromotions()]);
    let o: Order[] = []; let b: TableBooking[] = [];
    if (adminRoute) {
      try { const response = await fetch('/api/admin/orders', { credentials: 'include', cache: 'no-store' }); const result = await response.json().catch(() => ({})); if (response.ok && Array.isArray(result.orders)) o = result.orders; } catch (error) { console.warn('Admin order sync failed:', error); }
      b = await dbFetchBookings(currentUser.id);
    } else [o, b] = await Promise.all([dbFetchOrders(currentUser.id, currentUser.role), dbFetchBookings(currentUser.id)]);
    setRestaurants(r); setProducts(p); setOrders(o); setBookings(b); setCategories(c); setPromotions(pr);
  }, [currentUser.id, currentUser.role]);
  useEffect(() => { void syncData(); }, [syncData]);

  const toggleProductAvailability = async (id: string) => { const p = products.find(x => x.id === id); if (!p) return; const updated = { ...p, available: !p.available }; setProducts(prev => prev.map(x => x.id === id ? updated : x)); const ok = await saveProduct(updated); if (!ok) { setProducts(prev => prev.map(x => x.id === id ? p : x)); showToast('Échec de mise à jour du produit.'); } };
  const addNewProduct = async (data: Omit<Product, 'id' | 'createdAt'>) => { const p: Product = { ...data, id: `prod-${Date.now()}`, createdAt: new Date().toISOString() }; setProducts(prev => [p, ...prev]); if (!(await saveProduct(p, null, true))) { setProducts(prev => prev.filter(x => x.id !== p.id)); throw new Error('Product could not be saved'); } return p; };
  const updateProduct = async (p: Product) => { const old = products.find(x => x.id === p.id); setProducts(prev => prev.map(x => x.id === p.id ? p : x)); const ok = await saveProduct(p); if (!ok && old) setProducts(prev => prev.map(x => x.id === p.id ? old : x)); return ok; };
  const deleteProduct = async (id: string) => { const old = products.find(x => x.id === id); setProducts(prev => prev.filter(x => x.id !== id)); const ok = await removeProduct(id); if (!ok && old) setProducts(prev => [old, ...prev]); return ok; };
  const [cartItems, setCartItems] = useState<CartItem[]>([]); const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const showToast = (msg: string) => { setToastMessage(msg); window.setTimeout(() => setToastMessage(null), 3000); };
  const addToCart = (item: CartItem) => { setCartItems(prev => { if (prev.length && prev[0].restaurantId !== item.restaurantId) return [item]; const i = prev.findIndex(x => x.productId === item.productId && JSON.stringify(x.selectedOptions) === JSON.stringify(item.selectedOptions)); if (i >= 0) { const copy=[...prev]; copy[i]={...copy[i], quantity:copy[i].quantity+item.quantity, totalPrice:(copy[i].quantity+item.quantity)*copy[i].unitPrice}; return copy; } return [...prev,item]; }); showToast(t('addedToCartSuccess')); };
  const removeFromCart=(id:string)=>setCartItems(p=>p.filter(x=>x.id!==id)); const updateCartQuantity=(id:string,d:number)=>setCartItems(p=>p.map(x=>x.id===id?{...x,quantity:Math.max(0,x.quantity+d),totalPrice:Math.max(0,x.quantity+d)*x.unitPrice}:x).filter(x=>x.quantity>0)); const clearCart=()=>{setCartItems([]);setAppliedPromo(null);};
  const cartSubtotal=useMemo(()=>cartItems.reduce((s,i)=>s+i.totalPrice,0),[cartItems]); const cartDeliveryFee=useMemo(()=>cartItems.length?currentNeighborhood.deliveryFee:0,[cartItems,currentNeighborhood]); const cartDiscount=useMemo(()=>{if(!appliedPromo)return 0;const p=promotions.find(x=>x.code===appliedPromo);if(!p)return 0;return p.discountType==='fixed'?p.discountValue:Math.round(cartSubtotal*p.discountValue/100)},[appliedPromo,promotions,cartSubtotal]); const cartTotal=useMemo(()=>Math.max(0,cartSubtotal+cartDeliveryFee-cartDiscount),[cartSubtotal,cartDeliveryFee,cartDiscount]); const cartCount=useMemo(()=>cartItems.reduce((s,i)=>s+i.quantity,0),[cartItems]);
  const applyPromoCode=(code:string)=>{const p=promotions.find(x=>x.code.toUpperCase()===code.trim().toUpperCase());if(p&&p.active&&cartSubtotal>=p.minOrderValue){setAppliedPromo(p.code);return true}return false};
  const activeOrder=useMemo(()=>orders.find(o=>o.orderStatus!=='delivered'&&o.orderStatus!=='cancelled'&&(o.userId===currentUser.id||currentUser.role!=='customer'))||null,[orders,currentUser]);
  const orderIdempotencyKey = useRef<string | null>(null);
  const createOrder=async(paymentMethod:PaymentMethod)=>{
    const first=cartItems[0]; if(!first) throw new Error('Cart is empty.');
    const restaurant=restaurants.find(r=>r.id===first.restaurantId)||restaurants[0]; if(!restaurant) throw new Error('Restaurant is not available.');
    const customer={name:deliveryAddress.fullName||currentUser.fullName,phone:deliveryAddress.phone||currentUser.phone,email:deliveryAddress.email||currentUser.email};
    if(!customer.name||!customer.phone||!customer.email||!deliveryAddress.streetAddress||!deliveryAddress.neighborhood) throw new Error('Customer and delivery information are required.');
    if(!orderIdempotencyKey.current) orderIdempotencyKey.current = crypto.randomUUID();
    const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json','X-Idempotency-Key':orderIdempotencyKey.current},credentials:'include',body:JSON.stringify({userId:currentUser.id||undefined,restaurantId:restaurant.id,items:cartItems,deliveryFee:cartDeliveryFee,promoCode:appliedPromo||undefined,paymentMethod,deliveryAddress:{...deliveryAddress,email:customer.email},customer})});
    const result=await response.json().catch(()=>({})); if(!response.ok||!result.ok||!result.order) throw new Error(String(result.error||'Unable to create order.'));
    const savedOrder=result.order as Order; orderIdempotencyKey.current=null; setOrders(prev=>[savedOrder,...prev.filter(o=>o.id!==savedOrder.id)]); clearCart(); setSelectedOrderId(savedOrder.id);
    addNotification({userId:savedOrder.userId,titleFR:'Commande Confirmée ! 🛵',titleEN:'Order Confirmed! 🛵',messageFR:`Votre commande ${savedOrder.id} est en cours.`,messageEN:`Your order ${savedOrder.id} is in progress.`,type:'order',orderId:savedOrder.id});
    return savedOrder;
  };
  const updateOrderStatus=async(id:string,status:OrderStatus,noteFR?:string,noteEN?:string)=>{const now=new Date().toISOString();setOrders(p=>p.map(o=>o.id===id?{...o,orderStatus:status,deliveredAt:status==='delivered'?now:o.deliveredAt,statusHistory:[...o.statusHistory,{status,timestamp:now,noteFR:noteFR||`Statut mis à jour : ${status}`,noteEN:noteEN||`Status updated: ${status}` }]}:o));if(currentUser.role==='admin'){const response=await fetch(`/api/admin/orders/${encodeURIComponent(id)}/status`,{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({status,noteFR,noteEN})});if(!response.ok){showToast('Échec de mise à jour de la commande.');await syncData();return;}}else{const ok=await dbUpdateOrderStatus(id,status,noteFR,noteEN);if(!ok)await syncData();}};
  const reorder=(o:Order)=>{setCartItems(o.items);setActiveTab('cart');};
  const [favoriteRestaurantIds,setFavoriteRestaurantIds]=useState<string[]>([]);const [favoriteProductIds,setFavoriteProductIds]=useState<string[]>([]);const toggleFavoriteRestaurant=(id:string)=>setFavoriteRestaurantIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);const toggleFavoriteProduct=(id:string)=>setFavoriteProductIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);const isFavoriteRestaurant=(id:string)=>favoriteRestaurantIds.includes(id);const isFavoriteProduct=(id:string)=>favoriteProductIds.includes(id);
  const [notifications,setNotifications]=useState<AppNotification[]>([]);const addNotification=(n:Omit<AppNotification,'id'|'createdAt'|'read'>)=>setNotifications(p=>[{...n,id:`notif-${Date.now()}`,read:false,createdAt:new Date().toISOString()},...p]);const markNotificationAsRead=(id:string)=>setNotifications(p=>p.map(n=>n.id===id?{...n,read:true}:n));const markAllNotificationsAsRead=()=>setNotifications(p=>p.map(n=>({...n,read:true})));const deleteNotification=(id:string)=>setNotifications(p=>p.filter(n=>n.id!==id));const clearAllNotifications=()=>setNotifications([]);const unreadNotificationsCount=notifications.filter(n=>!n.read).length;const latestAlertNotification=notifications.find(n=>!n.read)||null;const dismissAlertNotification=()=>latestAlertNotification&&markNotificationAsRead(latestAlertNotification.id);
  const [toastMessage,setToastMessage]=useState<string|null>(null);const [isBookingModalOpen,setIsBookingModalOpen]=useState(false);const [bookingRestaurant,setBookingRestaurant]=useState<Restaurant|null>(null);const [selectedBooking,setSelectedBooking]=useState<TableBooking|null>(null);const openBookingModal=(r?:Restaurant)=>{setBookingRestaurant(r||null);setIsBookingModalOpen(true)};const closeBookingModal=()=>setIsBookingModalOpen(false);const createBooking=async(data:any)=>{const b:any={...data,id:`BK-${Date.now()}`,createdAt:new Date().toISOString(),confirmationCode:`TER-${Math.floor(100000+Math.random()*900000)}`,status:'pending'};setBookings(p=>[b,...p]);const ok=await dbInsertBooking(b);if(!ok){setBookings(p=>p.filter(x=>x.id!==b.id));throw new Error('Booking could not be saved');}return b};const cancelBooking=async(id:string)=>{setBookings(p=>p.map(b=>b.id===id?{...b,status:'cancelled'}:b));const ok=await dbCancelBooking(id);if(!ok)await syncData();};
  const value:AppContextType={language,setLanguage,t,isSupabaseConnected:isSupabaseConfigured,syncData,currentUser,setCurrentUser,setUserFromClerk,role:currentUser.role,switchRole,isAuthenticated,logout,activeScreen,setActiveScreen,activeTab,setActiveTab,selectedRestaurant,setSelectedRestaurant,selectedProduct,setSelectedProduct,selectedOrderId,setSelectedOrderId,currentNeighborhood,setCurrentNeighborhood,deliveryAddress,setDeliveryAddress,restaurants,products,categories,promotions,toggleProductAvailability,addNewProduct,updateProduct,deleteProduct,cartItems,addToCart,removeFromCart,updateCartQuantity,clearCart,cartSubtotal,cartDeliveryFee,cartDiscount,cartTotal,appliedPromo,applyPromoCode,cartCount,orders,activeOrder,createOrder,updateOrderStatus,reorder,favoriteRestaurantIds,favoriteProductIds,toggleFavoriteRestaurant,toggleFavoriteProduct,isFavoriteRestaurant,isFavoriteProduct,notifications,unreadNotificationsCount,markNotificationAsRead,markAllNotificationsAsRead,deleteNotification,clearAllNotifications,addNotification,latestAlertNotification,dismissAlertNotification,toastMessage,showToast,bookings,createBooking,cancelBooking,isBookingModalOpen,bookingRestaurant,openBookingModal,closeBookingModal,selectedBooking,setSelectedBooking};
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
export const useApp=()=>{const ctx=useContext(AppContext);if(!ctx)throw new Error('useApp must be used inside AppProvider');return ctx};
