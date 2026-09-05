import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category, Order, OrderStatus, Product, Promotion, Restaurant, TableBooking, User } from '../types';

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
    const { data, error } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(r => ({
      id: r.id, name: r.name || '', descriptionFR: r.description_fr || '', descriptionEN: r.description_en || '', logoUrl: r.logo_url || '', coverImageUrl: r.cover_image_url || '',
      address: r.address || '', neighborhood: r.neighborhood || '', latitude: numberOr(r.latitude), longitude: numberOr(r.longitude), phone: r.phone || '', rating: numberOr(r.rating),
      reviewCount: numberOr(r.review_count), deliveryFee: numberOr(r.delivery_fee), estimatedDeliveryTime: r.estimated_delivery_time || '', minOrder: numberOr(r.min_order),
      isOpen: r.is_open ?? true, isFeatured: r.is_featured ?? false, cuisineTypes: Array.isArray(r.cuisine_types) ? r.cuisine_types : [], tags: Array.isArray(r.tags) ? r.tags : [], createdAt: r.created_at || ''
    }));
  } catch (err) { console.error('Error fetching restaurants from Supabase:', err); return []; }
};

export const dbFetchProducts = async (): Promise<Product[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('products').select('*, restaurants(name)').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(p => ({
      id: p.id, restaurantId: p.restaurant_id || '', restaurantName: p.restaurant?.name || p.restaurant_name || '', categoryId: p.category_id || '',
      nameFR: p.name_fr || '', nameEN: p.name_en || '', descriptionFR: p.description_fr || '', descriptionEN: p.description_en || '', imageUrl: p.image_url || '',
      price: numberOr(p.price), originalPrice: p.original_price == null ? undefined : numberOr(p.original_price), available: p.available ?? true, rating: numberOr(p.rating),
      reviewCount: numberOr(p.review_count), prepTimeMinutes: numberOr(p.prep_time_minutes), isSpicy: p.is_spicy ?? false, isPopular: p.is_popular ?? false, isSignature: p.is_signature ?? false,
      ingredientsFR: Array.isArray(p.ingredients_fr) ? p.ingredients_fr : [], ingredientsEN: Array.isArray(p.ingredients_en) ? p.ingredients_en : [], options: Array.isArray(p.options) ? p.options : [], createdAt: p.created_at || ''
    }));
  } catch (err) { console.error('Error fetching products from Supabase:', err); return []; }
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
