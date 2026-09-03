export type AppLanguage = 'fr' | 'en';

export type UserRole = 'customer' | 'restaurant' | 'driver' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  photoUrl?: string;
  role: UserRole;
  language: AppLanguage;
  createdAt: string;
  restaurantId?: string;
  vehicleInfo?: string;
}

export interface DakarNeighborhood {
  id: string;
  name: string;
  zone: string;
  deliveryFee: number;
  deliveryTimeEstimate: string;
  lat: number;
  lng: number;
}

export interface Restaurant {
  id: string;
  name: string;
  descriptionFR: string;
  descriptionEN: string;
  logoUrl: string;
  coverImageUrl: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  phone: string;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  estimatedDeliveryTime: string;
  minOrder: number;
  isOpen: boolean;
  isFeatured: boolean;
  cuisineTypes: string[];
  tags: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  nameFR: string;
  nameEN: string;
  imageUrl: string;
  iconName: string;
  sortOrder: number;
  dishCount: number;
}

export interface ProductOptionChoice {
  id: string;
  nameFR: string;
  nameEN: string;
  price: number;
}

export interface ProductOptionGroup {
  id: string;
  nameFR: string;
  nameEN: string;
  required: boolean;
  maxSelections: number;
  choices: ProductOptionChoice[];
}

export interface Product {
  id: string;
  restaurantId: string;
  restaurantName: string;
  categoryId: string;
  nameFR: string;
  nameEN: string;
  descriptionFR: string;
  descriptionEN: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  available: boolean;
  rating: number;
  reviewCount: number;
  prepTimeMinutes: number;
  isSpicy?: boolean;
  isPopular?: boolean;
  isSignature?: boolean;
  ingredientsFR: string[];
  ingredientsEN: string[];
  options?: ProductOptionGroup[];
  createdAt: string;
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  choiceId: string;
  choiceName: string;
  price: number;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  restaurantId: string;
  restaurantName: string;
  quantity: number;
  selectedOptions: SelectedOption[];
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus =
  | 'pending' | 'accepted' | 'preparing' | 'ready' | 'assigned'
  | 'picked_up' | 'delivering' | 'driver_arrived' | 'delivered' | 'cancelled';

export type PaymentMethod = 'wave' | 'orange_money' | 'mtn' | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cash_pending';

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  email?: string;
  neighborhood: string;
  streetAddress: string;
  buildingInfo?: string;
  instructions?: string;
  lat?: number;
  lng?: number;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  photoUrl: string;
  rating: number;
  totalDeliveries: number;
  vehicleType: string;
  vehiclePlate: string;
  currentLat: number;
  currentLng: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLogo: string;
  restaurantPhone: string;
  restaurantAddress: string;
  driver?: DriverInfo;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  promoCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryAddress: DeliveryAddress;
  createdAt: string;
  estimatedDeliveryTime: string;
  deliveredAt?: string;
  statusHistory: { status: OrderStatus; timestamp: string; noteFR: string; noteEN: string }[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  restaurantId: string;
  productId?: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  code: string;
  titleFR: string;
  titleEN: string;
  descriptionFR: string;
  descriptionEN: string;
  imageUrl: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  titleFR: string;
  titleEN: string;
  messageFR: string;
  messageEN: string;
  type: 'order' | 'promo' | 'driver' | 'system' | 'booking';
  orderId?: string;
  bookingId?: string;
  orderStatus?: OrderStatus;
  restaurantName?: string;
  restaurantLogo?: string;
  driverName?: string;
  driverPhone?: string;
  badgeLabelFR?: string;
  badgeLabelEN?: string;
  actionType?: 'track_order' | 'view_booking' | 'call_driver' | 'reorder' | 'open_promo';
  read: boolean;
  createdAt: string;
}

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';
export type SeatingArea = 'indoor_ac' | 'terrace' | 'vip_room' | 'rooftop' | 'standard';

export interface TableBooking {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLogo: string;
  restaurantCoverImage: string;
  restaurantAddress: string;
  restaurantPhone: string;
  restaurantNeighborhood: string;
  userId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  date: string;
  time: string;
  guestsCount: number;
  seatingArea: SeatingArea;
  specialRequests?: string;
  occasion?: string;
  status: BookingStatus;
  createdAt: string;
  confirmationCode: string;
}
