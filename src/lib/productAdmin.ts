import { Product } from '../types';
import { getSupabase } from './supabase';

const row = (p: Product) => ({
  id: p.id,
  restaurant_id: p.restaurantId,
  restaurant_name: p.restaurantName,
  category_id: p.categoryId,
  name_fr: p.nameFR,
  name_en: p.nameEN,
  description_fr: p.descriptionFR,
  description_en: p.descriptionEN,
  image_url: p.imageUrl,
  price: p.price,
  original_price: p.originalPrice ?? null,
  available: p.available,
  rating: p.rating,
  review_count: p.reviewCount,
  prep_time_minutes: p.prepTimeMinutes,
  is_spicy: p.isSpicy ?? false,
  is_popular: p.isPopular ?? false,
  is_signature: p.isSignature ?? false,
  ingredients_fr: p.ingredientsFR ?? [],
  ingredients_en: p.ingredientsEN ?? [],
  options: p.options ?? [],
  created_at: p.createdAt,
});

export const saveProduct = async (product: Product): Promise<boolean> => {
  const db = getSupabase();
  if (!db) return true;
  const { error } = await db.from('products').upsert(row(product), { onConflict: 'id' });
  if (error) console.error('Product save failed:', error);
  return !error;
};

export const removeProduct = async (productId: string): Promise<boolean> => {
  const db = getSupabase();
  if (!db) return true;
  const { error } = await db.from('products').delete().eq('id', productId);
  if (error) console.error('Product delete failed:', error);
  return !error;
};
