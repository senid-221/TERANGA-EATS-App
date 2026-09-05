import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order, OrderStatus, Product, Restaurant, TableBooking, User, Category } from '../types';

interface Promotion {
  id: string;
  code: string;
  titleFR: string;
  titleEN: string;
  descriptionFR: string;
  descriptionEN: string;
  imageUrl: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your-project')
);

let supabaseInstance: SupabaseClient | null = null;
export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) return null;
  if (!supabaseInstance) supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  return supabaseInstance;
};

const numberOr = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const dbFetchRestaurants = async (): Promise<Restaurant[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('restaurants').select('*');
    if (error || !data) return [];
    return data.map(r => ({
      id: r.id,
      name: r.name || '',
      descriptionFR: r.description_fr || r.descriptionFR || r.description || '',
      descriptionEN: r.description_en || r.descriptionEN || r.description || '',
      logoUrl: r.logo_url || r.logoUrl || '',
      coverImageUrl: r.cover_image_url || r.coverImageUrl || '',
      address: r.address || '',
      neighborhood: r.neighborhood || '',
      latitude: numberOr(r.latitude, 0),
      longitude: numberOr(r.longitude, 0),
      phone: r.phone || '',
      rating: numberOr(r.rating, 0),
      reviewCount: numberOr(r.review_count ?? r.reviewCount, 0),
      deliveryFee: numberOr(r.delivery_fee ?? r.deliveryFee, 0),
      estimatedDeliveryTime: r.estimated_delivery_time || r.delivery_time || '',
      minOrder: numberOr(r.min_order ?? r.minOrder, 0),
      isOpen: r.is_open ?? true,
      isFeatured: r.is_featured ?? false,
      cuisineTypes: Array.isArray(r.cuisine_types) ? r.cuisine_types : [],
      tags: Array.isArray(r.tags) ? r.tags : [],
      createdAt: r.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Failed to fetch restaurants from Supabase:', err);
    return [];
  }
};

export const dbFetchProducts = async (): Promise<Product[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error || !data) return [];
    return data.map(p => ({
      id: p.id,
      restaurantId: p.restaurant_id || p.restaurantId || '',
      restaurantName: p.restaurant_name || p.restaurantName || '',
      categoryId: p.category_id || p.categoryId || '',
      nameFR: p.name_fr || p.nameFR || p.name || '',
      nameEN: p.name_en || p.nameEN || p.name || '',
      descriptionFR: p.description_fr || p.descriptionFR || p.description || '',
      descriptionEN: p.description_en || p.descriptionEN || p.description || '',
      imageUrl: p.image_url || p.imageUrl || '',
      price: numberOr(p.price, 0),
      originalPrice: p.original_price == null ? undefined : numberOr(p.original_price, 0),
      available: p.available ?? true,
      rating: numberOr(p.rating, 0),
      reviewCount: numberOr(p.review_count ?? p.reviewCount, 0),
      prepTimeMinutes: numberOr(p.prep_time_minutes ?? p.prepTimeMinutes, 0),
      isSpicy: p.is_spicy ?? p.isSpicy ?? false,
      isPopular: p.is_popular ?? p.isPopular ?? false,
      isSignature: p.is_signature ?? p.isSignature ?? false,
      ingredientsFR: Array.isArray(p.ingredients_fr) ? p.ingredients_fr : [],
      ingredientsEN: Array.isArray(p.ingredients_en) ? p.ingredients_en : [],
      options: Array.isArray(p.options) ? p.options : [],
      createdAt: p.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Failed to fetch products from Supabase:', err);
    return [];
  }
};

const mapOrder = d => ({
  id: d.id,
  userId: d.user_id,
  customerName: d.customer_name,
  customerPhone: d.customer_phone,
  customerEmail: d.customer_email || d.delivery_address?.email || '',
  restaurantId: d.restaurant_id,
  restaurantName: d.restaurant_name,
  restaurantLogo: d.restaurant_logo || '',
  restaurantPhone: d.restaurant_phone || '',
  restaurantAddress: d.restaurant_address || '',
  driver: d.driver,
  items: Array.isArray(d.items) ? d.items : [],
  subtotal: numberOr(d.subtotal, 0),
  deliveryFee: numberOr(d.delivery_fee, 0),
  discount: numberOr(d.discount, 0),
  promoCode: d.promo_code || undefined,
  total: numberOr(d.total, 0),
  paymentMethod: d.payment_method,
  paymentStatus: d.payment_status,
  orderStatus: d.order_status,
  deliveryAddress: d.delivery_address || {},
  statusHistory: Array.isArray(d.status_history) ? d.status_history : [],
  createdAt: d.created_at,
  deliveredAt: d.delivered_at,
  estimatedDeliveryTime: d.estimated_delivery_time || '',
});

export const dbFetchOrders = async (userId?: string, role?: string): Promise<Order[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (role === 'customer' && userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapOrder);
  } catch (err) {
    console.error('Failed to fetch orders from Supabase:', err);
    return [];
  }
};

export const dbInsertOrder = async (order: Order): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('orders').insert({
      id: order.id, user_id: order.userId, customer_name: order.customerName, customer_phone: order.customerPhone,
      customer_email: order.customerEmail, restaurant_id: order.restaurantId, restaurant_name: order.restaurantName,
      restaurant_logo: order.restaurantLogo, restaurant_phone: order.restaurantPhone, restaurant_address: order.restaurantAddress,
      driver: order.driver, items: order.items, subtotal: order.subtotal, delivery_fee: order.deliveryFee, discount: order.discount,
      promo_code: order.promoCode, total: order.total, payment_method: order.paymentMethod, payment_status: order.paymentStatus,
      order_status: order.orderStatus, delivery_address: order.deliveryAddress, status_history: order.statusHistory, created_at: order.createdAt,
    });
    return !error;
  } catch (err) {
    console.error('Error inserting order into Supabase:', err);
    return false;
  }
};

export const dbUpdateOrderStatus = async (orderId: string, status: OrderStatus, noteFR?: string, noteEN?: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { data: current } = await supabase.from('orders').select('status_history').eq('id', orderId).single();
    const history = Array.isArray(current?.status_history) ? current.status_history : [];
    const now = new Date().toISOString();
    const { error } = await supabase.from('orders').update({
      order_status: status,
      status_history: [...history, { status, timestamp: now, noteFR: noteFR || `Statut : ${status}`, noteEN: noteEN || `Status: ${status}` }],
      delivered_at: status === 'delivered' ? now : null,
    }).eq('id', orderId);
    return !error;
  } catch (err) {
    console.error('Error updating order in Supabase:', err);
    return false;
  }
};

export const dbFetchBookings = async (userId?: string): Promise<TableBooking[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    let query = supabase.from('table_bookings').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(b => ({
      id: b.id, userId: b.user_id, restaurantId: b.restaurant_id, restaurantName: b.restaurant_name,
      restaurantLogo: b.restaurant_logo || '', restaurantCoverImage: b.restaurant_image || '', restaurantAddress: b.restaurant_address || '',
      restaurantPhone: b.restaurant_phone || '', restaurantNeighborhood: b.restaurant_neighborhood || '', date: b.date, time: b.time,
      guestsCount: numberOr(b.guests ?? b.guests_count, 2), seatingArea: b.seating_area || 'indoor_ac', specialRequests: b.special_requests,
      occasion: b.occasion, guestName: b.customer_name || b.guest_name || '', guestPhone: b.customer_phone || b.guest_phone || '',
      guestEmail: b.customer_email || b.guest_email || '', confirmationCode: b.confirmation_code || '', status: b.status, createdAt: b.created_at,
    }));
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return [];
  }
};

export const dbInsertBooking = async (booking: TableBooking): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('table_bookings').insert({
      id: booking.id, user_id: booking.userId, restaurant_id: booking.restaurantId, restaurant_name: booking.restaurantName,
      restaurant_address: booking.restaurantAddress, restaurant_image: booking.restaurantCoverImage, restaurant_phone: booking.restaurantPhone,
      restaurant_neighborhood: booking.restaurantNeighborhood, date: booking.date, time: booking.time, guests: booking.guestsCount,
      seating_area: booking.seatingArea, special_requests: booking.specialRequests, occasion: booking.occasion, customer_name: booking.guestName,
      customer_phone: booking.guestPhone, customer_email: booking.guestEmail, confirmation_code: booking.confirmationCode, status: booking.status, created_at: booking.createdAt,
    });
    return !error;
  } catch (err) {
    console.error('Error inserting booking in Supabase:', err);
    return false;
  }
};

export const dbCancelBooking = async (bookingId: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('table_bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    return !error;
  } catch (err) {
    console.error('Error cancelling booking in Supabase:', err);
    return false;
  }
};

export const dbUpsertProfile = async (user: User): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase || !user.id) return false;
  try {
    const { error } = await supabase.from('profiles').upsert({ id: user.id, full_name: user.fullName, email: user.email, phone: user.phone, role: user.role, language: user.language, photo_url: user.photoUrl, updated_at: new Date().toISOString() });
    return !error;
  } catch (err) {
    console.error('Error upserting profile in Supabase:', err);
    return false;
  }
};

export const dbFetchCategories = async (): Promise<Category[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    if (error || !data) return [];
    return data.map(c => ({ id: c.id, nameFR: c.name_fr || '', nameEN: c.name_en || '', imageUrl: c.image_url || '', iconName: c.icon_name || '', sortOrder: numberOr(c.sort_order, 0), dishCount: numberOr(c.dish_count, 0) }));
  } catch { return []; }
};

export const dbFetchPromotions = async (): Promise<Promotion[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(p => ({
      id: p.id, code: p.code || '', titleFR: p.title_fr || '', titleEN: p.title_en || '', descriptionFR: p.description_fr || '', descriptionEN: p.description_en || '',
      imageUrl: p.image_url || '', discountType: p.discount_type === 'fixed' ? 'fixed' : 'percentage', discountValue: numberOr(p.discount_value, 0),
      minOrderValue: numberOr(p.min_order_value, 0), startDate: p.valid_from || '', endDate: p.valid_until || '', active: p.is_active ?? false,
    }));
  } catch { return []; }
};
