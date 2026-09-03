import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order, OrderStatus, Product, Restaurant, TableBooking, User } from '../types';

// Supabase environment variables
const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project')
);

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
};

// ==================== RESTAURANTS ====================
export const dbFetchRestaurants = async (): Promise<Restaurant[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.from('restaurants').select('*');
    if (error || !data || data.length === 0) {
      return [];
    }
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      descriptionFR: r.description_fr || r.descriptionFR || r.description || '',
      descriptionEN: r.description_en || r.descriptionEN || r.description || '',
      logoUrl: r.logo_url || r.logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&q=80',
      coverImageUrl: r.cover_image_url || r.coverImageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      address: r.address,
      neighborhood: r.neighborhood || 'Dakar Plateau',
      latitude: Number(r.latitude) || 14.6708,
      longitude: Number(r.longitude) || -17.4381,
      phone: r.phone || '+221 33 821 03 02',
      rating: Number(r.rating) || 4.8,
      reviewCount: Number(r.review_count || r.reviewCount) || 50,
      deliveryFee: Number(r.delivery_fee || r.deliveryFee) || 500,
      estimatedDeliveryTime: r.estimated_delivery_time || r.delivery_time || '25–35 min',
      minOrder: Number(r.min_order || r.minOrder) || 2000,
      isOpen: r.is_open ?? true,
      isFeatured: r.is_featured ?? true,
      cuisineTypes: r.cuisine_types || ['Plats Sénégalais', 'Thiéboudienne'],
      tags: r.tags || ['Authentique', 'Populaire'],
      createdAt: r.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Failed to fetch restaurants from Supabase:', err);
    return [];
  }
};

// ==================== PRODUCTS / DISHES ====================
export const dbFetchProducts = async (): Promise<Product[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error || !data || data.length === 0) {
      return [];
    }
    return data.map((p) => ({
      id: p.id,
      restaurantId: p.restaurant_id || p.restaurantId,
      restaurantName: p.restaurant_name || p.restaurantName || 'Chez Loutcha Teranga',
      categoryId: p.category_id || p.categoryId,
      nameFR: p.name_fr || p.nameFR || p.name,
      nameEN: p.name_en || p.nameEN || p.name,
      descriptionFR: p.description_fr || p.descriptionFR || p.description,
      descriptionEN: p.description_en || p.descriptionEN || p.description,
      imageUrl: p.image_url || p.imageUrl,
      price: Number(p.price) || 3500,
      originalPrice: p.original_price ? Number(p.original_price) : undefined,
      available: p.available ?? true,
      rating: Number(p.rating) || 4.9,
      reviewCount: Number(p.review_count) || 80,
      prepTimeMinutes: Number(p.prep_time_minutes) || 20,
      isSpicy: p.is_spicy ?? false,
      isPopular: p.is_popular ?? true,
      isSignature: p.is_signature ?? false,
      ingredientsFR: p.ingredients_fr || [],
      ingredientsEN: p.ingredients_en || [],
      options: p.options || [],
      createdAt: p.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Failed to fetch products from Supabase:', err);
    return [];
  }
};

// ==================== ORDERS ====================
export const dbFetchOrders = async (userId?: string, role?: string): Promise<Order[]> => {
  const supabase = getSupabase();
  if (!supabase) {
    return [];
  }

  try {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    // Filter by user if regular customer
    if (role === 'customer' && userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('Error fetching orders from Supabase:', error?.message);
      return [];
    }

    return data.map((d) => ({
      id: d.id,
      userId: d.user_id,
      customerName: d.customer_name,
      customerPhone: d.customer_phone,
      restaurantId: d.restaurant_id,
      restaurantName: d.restaurant_name,
      restaurantLogo: d.restaurant_logo,
      restaurantPhone: d.restaurant_phone,
      restaurantAddress: d.restaurant_address,
      driver: d.driver,
      items: d.items || [],
      subtotal: d.subtotal,
      deliveryFee: d.delivery_fee,
      discount: d.discount || 0,
      promoCode: d.promo_code,
      total: d.total,
      paymentMethod: d.payment_method,
      paymentStatus: d.payment_status,
      orderStatus: d.order_status,
      deliveryAddress: d.delivery_address,
      statusHistory: d.status_history || [],
      createdAt: d.created_at,
      deliveredAt: d.delivered_at,
      estimatedDeliveryTime: d.estimated_delivery_time || '25–35 min',
    }));
  } catch (err) {
    console.error('Failed to fetch orders from Supabase:', err);
    return [];
  }
};

export const dbInsertOrder = async (order: Order): Promise<boolean> => {
  // Always save in localStorage cache
  

  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    const { error } = await supabase.from('orders').insert({
      id: order.id,
      user_id: order.userId,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      restaurant_id: order.restaurantId,
      restaurant_name: order.restaurantName,
      restaurant_logo: order.restaurantLogo,
      restaurant_phone: order.restaurantPhone,
      restaurant_address: order.restaurantAddress,
      driver: order.driver,
      items: order.items,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      discount: order.discount,
      promo_code: order.promoCode,
      total: order.total,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
      delivery_address: order.deliveryAddress,
      status_history: order.statusHistory,
      created_at: order.createdAt,
    });

    if (error) {
      console.error('Supabase order insert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error inserting order into Supabase:', err);
    return false;
  }
};

export const dbUpdateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  noteFR?: string,
  noteEN?: string
): Promise<boolean> => {
  

  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    const { data: current } = await supabase.from('orders').select('status_history').eq('id', orderId).single();
    const history = current?.status_history || [];
    const newHistory = [
      ...history,
      {
        status,
        timestamp: new Date().toISOString(),
        noteFR: noteFR || `Statut : ${status}`,
        noteEN: noteEN || `Status: ${status}`,
      },
    ];

    const { error } = await supabase
      .from('orders')
      .update({
        order_status: status,
        status_history: newHistory,
        delivered_at: status === 'delivered' ? new Date().toISOString() : null,
      })
      .eq('id', orderId);

    if (error) {
      console.error('Supabase status update error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating order in Supabase:', err);
    return false;
  }
};

// ==================== TABLE BOOKINGS ====================
export const dbFetchBookings = async (userId?: string): Promise<TableBooking[]> => {
  const supabase = getSupabase();
  if (!supabase) {
    return [];
  }

  try {
    let query = supabase.from('table_bookings').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) {
      return [];
    }
    return data.map((b) => ({
      id: b.id,
      userId: b.user_id,
      restaurantId: b.restaurant_id,
      restaurantName: b.restaurant_name,
      restaurantLogo: b.restaurant_logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&q=80',
      restaurantCoverImage: b.restaurant_image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      restaurantAddress: b.restaurant_address,
      restaurantPhone: b.restaurant_phone,
      restaurantNeighborhood: b.restaurant_neighborhood || 'Dakar Plateau',
      date: b.date,
      time: b.time,
      guestsCount: b.guests || b.guests_count || 2,
      seatingArea: b.seating_area || 'indoor_ac',
      specialRequests: b.special_requests,
      occasion: b.occasion,
      guestName: b.customer_name || b.guest_name,
      guestPhone: b.customer_phone || b.guest_phone,
      guestEmail: b.customer_email || b.guest_email,
      confirmationCode: b.confirmation_code,
      status: b.status,
      createdAt: b.created_at,
    }));
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return [];
  }
};

export const dbInsertBooking = async (booking: TableBooking): Promise<boolean> => {
  

  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    const { error } = await supabase.from('table_bookings').insert({
      id: booking.id,
      user_id: booking.userId,
      restaurant_id: booking.restaurantId,
      restaurant_name: booking.restaurantName,
      restaurant_address: booking.restaurantAddress,
      restaurant_image: booking.restaurantCoverImage,
      restaurant_phone: booking.restaurantPhone,
      date: booking.date,
      time: booking.time,
      guests: booking.guestsCount,
      seating_area: booking.seatingArea,
      special_requests: booking.specialRequests,
      customer_name: booking.guestName,
      customer_phone: booking.guestPhone,
      customer_email: booking.guestEmail,
      confirmation_code: booking.confirmationCode,
      status: booking.status,
      created_at: booking.createdAt,
    });
    return !error;
  } catch (err) {
    console.error('Error inserting booking in Supabase:', err);
    return false;
  }
};

export const dbCancelBooking = async (bookingId: string): Promise<boolean> => {
  

  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    const { error } = await supabase.from('table_bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    return !error;
  } catch (err) {
    console.error('Error cancelling booking in Supabase:', err);
    return false;
  }
};

// ==================== USER PROFILES ====================
export const dbUpsertProfile = async (user: User): Promise<boolean> => {
  try {
    localStorage.setItem('teranga_user', JSON.stringify(user));
  } catch (e) {
    console.error('LocalStorage profile write failed:', e);
  }

  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      language: user.language,
      photo_url: user.photoUrl,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch (err) {
    console.error('Error upserting profile in Supabase:', err);
    return false;
  }
};

export const dbFetchCategories = async (): Promise<any[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    if (error || !data) return [];
    return data.map((c: any) => ({
      id: c.id,
      nameFR: c.name_fr || c.nameFR,
      nameEN: c.name_en || c.nameEN,
      imageUrl: c.image_url || c.imageUrl,
      iconName: c.icon_name || c.iconName,
      sortOrder: c.sort_order || c.sortOrder,
      dishCount: c.dish_count || c.dishCount || 0,
    }));
  } catch (err) {
    return [];
  }
};

export const dbFetchPromotions = async (): Promise<any[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('promotions').select('*');
    if (error || !data) return [];
    return data.map((p: any) => ({
      id: p.id,
      code: p.code,
      titleFR: p.title_fr || p.titleFR,
      titleEN: p.title_en || p.titleEN,
      descriptionFR: p.description_fr || p.descriptionFR,
      descriptionEN: p.description_en || p.descriptionEN,
      imageUrl: p.image_url || p.imageUrl,
      discountType: p.discount_type || p.discountType,
      discountValue: p.discount_value || p.discountValue,
      minOrderValue: p.min_order_value || p.minOrderValue,
      validUntil: p.valid_until || p.validUntil,
    }));
  } catch (err) {
    return [];
  }
};
