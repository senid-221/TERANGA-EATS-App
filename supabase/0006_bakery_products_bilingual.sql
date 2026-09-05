-- ============================================================
-- TerangaEats - Bakery & Pastry products (FR / EN)
-- Migration: 0006_bakery_products_bilingual.sql
-- ============================================================
-- Uses the five customer-provided bakery photos.
-- Image paths are under /product-images/ and should be deployed with
-- the frontend assets.

insert into public.categories (id, name_fr, name_en, image_url, icon_name, sort_order)
values (
  'cat-boulangerie',
  'Boulangerie & Pâtisserie',
  'Bakery & Pastry',
  '/product-images/gateau-anniversaire.jpg',
  'Cake',
  6
)
on conflict (id) do update set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  image_url = excluded.image_url,
  icon_name = excluded.icon_name,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, restaurant_id, restaurant_name, category_id,
  name, name_fr, name_en,
  description, description_fr, description_en,
  image_url, price, available, rating, review_count,
  prep_time_minutes, preparation_time,
  is_spicy, is_popular, is_signature, is_vegetarian,
  ingredients_fr, ingredients_en
)
values
(
  'prod-gateau-anniversaire', 'teranga-restaurant', 'TerangaRestaurant', 'cat-boulangerie',
  'Gâteau Anniversaire', 'Gâteau Anniversaire', 'Birthday Cake',
  'Gâteau d’anniversaire décoré avec crème, fleurs et message personnalisé.',
  'Gâteau d’anniversaire décoré avec crème, fleurs et message personnalisé.',
  'Birthday cake decorated with elegant cream, decorative flowers and a personalized message.',
  '/product-images/gateau-anniversaire.jpg', 2000, true, 4.9, 0, 60, 'Sur commande',
  false, true, true, false,
  '["Gâteau","Crème","Décoration","Message personnalisé"]'::jsonb,
  '["Cake","Cream","Decoration","Personalized message"]'::jsonb
),
(
  'prod-pain-chocolat', 'teranga-restaurant', 'TerangaRestaurant', 'cat-boulangerie',
  'Pain au Chocolat', 'Pain au Chocolat', 'Pain au Chocolat',
  'Pâte feuilletée dorée et croustillante, garnie de délicieux morceaux de chocolat.',
  'Pâte feuilletée dorée et croustillante, garnie de délicieux morceaux de chocolat.',
  'Golden, crispy laminated pastry filled with delicious chocolate.',
  '/product-images/pain-au-chocolat.jpg', 1000, true, 4.8, 0, 15, '15 min',
  false, true, false, true,
  '["Farine","Beurre","Chocolat","Sucre","Œuf"]'::jsonb,
  '["Flour","Butter","Chocolate","Sugar","Egg"]'::jsonb
),
(
  'prod-croissant-jambon-fromage', 'teranga-restaurant', 'TerangaRestaurant', 'cat-boulangerie',
  'Croissant Jambon Fromage', 'Croissant Jambon Fromage', 'Ham & Cheese Croissant',
  'Croissant doré garni de jambon et de fromage fondant. Idéal pour le petit-déjeuner ou une pause gourmande.',
  'Croissant doré garni de jambon et de fromage fondant. Idéal pour le petit-déjeuner ou une pause gourmande.',
  'Golden croissant filled with ham and melted cheese. Perfect for breakfast or a tasty snack.',
  '/product-images/croissant-jambon-fromage.jpg', 1500, true, 4.9, 0, 10, '10 min',
  false, true, true, false,
  '["Croissant","Jambon","Fromage"]'::jsonb,
  '["Croissant","Ham","Cheese"]'::jsonb
),
(
  'prod-cake-vanille', 'teranga-restaurant', 'TerangaRestaurant', 'cat-boulangerie',
  'Cake Vanille', 'Cake Vanille', 'Vanilla Cake',
  'Cake à la vanille moelleux et savoureux, avec une texture légère et agréable.',
  'Cake à la vanille moelleux et savoureux, avec une texture légère et agréable.',
  'Soft and delicious vanilla cake with a light and pleasant texture.',
  '/product-images/cake-vanille.jpg', 1200, true, 4.8, 0, 35, '35 min',
  false, false, false, true,
  '["Farine","Vanille","Œuf","Beurre","Sucre"]'::jsonb,
  '["Flour","Vanilla","Egg","Butter","Sugar"]'::jsonb
),
(
  'prod-croissant-nature', 'teranga-restaurant', 'TerangaRestaurant', 'cat-boulangerie',
  'Croissant Nature', 'Croissant Nature', 'Plain Croissant',
  'Croissant pur beurre, croustillant à l’extérieur et moelleux à l’intérieur.',
  'Croissant pur beurre, croustillant à l’extérieur et moelleux à l’intérieur.',
  'All-butter croissant, crispy and golden outside with a soft, flaky inside.',
  '/product-images/croissant-nature.jpg', 800, true, 4.9, 0, 10, '10 min',
  false, true, false, true,
  '["Farine","Beurre","Lait","Œuf","Sucre"]'::jsonb,
  '["Flour","Butter","Milk","Egg","Sugar"]'::jsonb
)
on conflict (id) do update set
  restaurant_id = excluded.restaurant_id,
  restaurant_name = excluded.restaurant_name,
  category_id = excluded.category_id,
  name = excluded.name,
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  description = excluded.description,
  description_fr = excluded.description_fr,
  description_en = excluded.description_en,
  image_url = excluded.image_url,
  price = excluded.price,
  available = excluded.available,
  rating = excluded.rating,
  prep_time_minutes = excluded.prep_time_minutes,
  preparation_time = excluded.preparation_time,
  is_popular = excluded.is_popular,
  is_signature = excluded.is_signature,
  is_vegetarian = excluded.is_vegetarian,
  ingredients_fr = excluded.ingredients_fr,
  ingredients_en = excluded.ingredients_en,
  updated_at = now();

update public.categories c
set dish_count = (
  select count(*) from public.products p where p.category_id = c.id
), updated_at = now()
where c.id = 'cat-boulangerie';

select '0006 bakery bilingual products applied successfully' as result;
