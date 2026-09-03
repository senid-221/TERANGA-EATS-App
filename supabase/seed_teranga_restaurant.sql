-- TerangaEats demo/initial catalog for Supabase
-- Restaurant: TerangaRestaurant
-- Prices are in FRW and intentionally kept between 500 and 1,500.
-- Images use direct Unsplash CDN URLs; the referenced Unsplash photos are free to use under the Unsplash License.

INSERT INTO restaurants (
  id, name, description_fr, description_en, logo_url, cover_image_url,
  address, neighborhood, latitude, longitude, phone, rating, review_count,
  delivery_fee, delivery_time, min_order, is_open, is_featured, cuisine_types, tags
) VALUES (
  'teranga-restaurant',
  'TerangaRestaurant',
  'Cuisine africaine et sénégalaise, préparée avec des saveurs authentiques.',
  'African and Senegalese cuisine prepared with authentic flavors.',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  'Dakar Plateau, Dakar', 'Dakar Plateau', 14.6708, -17.4381,
  '+221 77 578 41 58', 4.8, 128, 500, '20–30 min', 500,
  true, true,
  ARRAY['Sénégalaise','Africaine','Street Food'],
  ARRAY['Authentique','Populaire','Livraison rapide']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  logo_url = EXCLUDED.logo_url,
  cover_image_url = EXCLUDED.cover_image_url,
  address = EXCLUDED.address,
  neighborhood = EXCLUDED.neighborhood,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  phone = EXCLUDED.phone,
  is_open = EXCLUDED.is_open,
  is_featured = EXCLUDED.is_featured;

INSERT INTO categories (id, name_fr, name_en, image_url, icon_name, sort_order, dish_count) VALUES
  ('cat-plats', 'Plats', 'Meals', 'https://images.unsplash.com/photo-1664992960082-0ea299a9c53e?auto=format&fit=crop&w=700&q=80', 'Utensils', 1, 5),
  ('cat-grillades', 'Grillades', 'Grilled', 'https://images.unsplash.com/photo-1665400808116-f0e6339b7e9a?auto=format&fit=crop&w=700&q=80', 'Flame', 2, 2),
  ('cat-snacks', 'Snacks', 'Snacks', 'https://images.unsplash.com/photo-1572099107898-46f22b3af4f9?auto=format&fit=crop&w=700&q=80', 'Cookie', 3, 2),
  ('cat-accompagnements', 'Accompagnements', 'Sides', 'https://images.unsplash.com/photo-1529259266118-cf22737f713f?auto=format&fit=crop&w=700&q=80', 'Soup', 4, 1)
ON CONFLICT (id) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  image_url = EXCLUDED.image_url,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  dish_count = EXCLUDED.dish_count;

INSERT INTO products (
  id, restaurant_id, restaurant_name, category_id, name_fr, name_en,
  description_fr, description_en, image_url, price, available, rating,
  review_count, prep_time_minutes, is_spicy, is_popular, is_signature,
  ingredients_fr, ingredients_en
) VALUES
(
  'prod-teranga-jollof-chicken', 'teranga-restaurant', 'TerangaRestaurant', 'cat-plats',
  'Jollof Rice au Poulet', 'Chicken Jollof Rice',
  'Riz jollof parfumé accompagné de poulet grillé et légumes.',
  'Fragrant jollof rice served with grilled chicken and vegetables.',
  'https://images.unsplash.com/photo-1664992960082-0ea299a9c53e?auto=format&fit=crop&w=900&q=80',
  1500, true, 4.9, 86, 25, false, true, true,
  ARRAY['Riz','Poulet','Tomate','Poivron','Épices'], ARRAY['Rice','Chicken','Tomato','Bell pepper','Spices']
),
(
  'prod-teranga-yassa', 'teranga-restaurant', 'TerangaRestaurant', 'cat-plats',
  'Yassa Poulet', 'Chicken Yassa',
  'Poulet mariné au citron et mijoté avec des oignons caramélisés.',
  'Chicken marinated with lemon and simmered with caramelized onions.',
  'https://images.unsplash.com/photo-1665400808116-f0e6339b7e9a?auto=format&fit=crop&w=900&q=80',
  1500, true, 4.8, 74, 25, false, true, true,
  ARRAY['Poulet','Citron','Oignons','Riz','Épices'], ARRAY['Chicken','Lemon','Onions','Rice','Spices']
),
(
  'prod-teranga-thieb-poisson', 'teranga-restaurant', 'TerangaRestaurant', 'cat-plats',
  'Thiéboudienne au Poisson', 'Fish Thieboudienne',
  'Riz rouge au poisson et légumes, inspiré du plat national sénégalais.',
  'Red rice with fish and vegetables, inspired by Senegal’s national dish.',
  'https://images.unsplash.com/photo-1665400808116-f0e6339b7e9a?auto=format&fit=crop&w=900&q=80',
  1500, true, 4.9, 91, 30, false, true, true,
  ARRAY['Poisson','Riz','Carotte','Chou','Tomate'], ARRAY['Fish','Rice','Carrot','Cabbage','Tomato']
),
(
  'prod-teranga-mafe', 'teranga-restaurant', 'TerangaRestaurant', 'cat-plats',
  'Mafé au Poulet', 'Chicken Mafe',
  'Poulet tendre dans une sauce onctueuse aux arachides, servi avec du riz.',
  'Tender chicken in a creamy peanut sauce served with rice.',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
  1400, true, 4.7, 62, 25, false, true, false,
  ARRAY['Poulet','Arachide','Tomate','Riz','Légumes'], ARRAY['Chicken','Peanut','Tomato','Rice','Vegetables']
),
(
  'prod-teranga-poisson-grille', 'teranga-restaurant', 'TerangaRestaurant', 'cat-grillades',
  'Poisson Grillé', 'Grilled Fish',
  'Poisson grillé aux épices, servi avec une garniture fraîche.',
  'Seasoned grilled fish served with a fresh side.',
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80',
  1500, true, 4.8, 55, 25, false, true, false,
  ARRAY['Poisson','Citron','Ail','Épices'], ARRAY['Fish','Lemon','Garlic','Spices']
),
(
  'prod-teranga-poulet-braise', 'teranga-restaurant', 'TerangaRestaurant', 'cat-grillades',
  'Poulet Braisé', 'Grilled Chicken',
  'Morceaux de poulet marinés puis braisés aux épices maison.',
  'Chicken pieces marinated and grilled with our house spices.',
  'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=900&q=80',
  1500, true, 4.9, 83, 25, true, true, false,
  ARRAY['Poulet','Ail','Gingembre','Paprika','Épices'], ARRAY['Chicken','Garlic','Ginger','Paprika','Spices']
),
(
  'prod-teranga-samosa', 'teranga-restaurant', 'TerangaRestaurant', 'cat-snacks',
  'Samosa Viande', 'Beef Samosa',
  'Samosas croustillants farcis à la viande épicée.',
  'Crispy samosas filled with seasoned meat.',
  'https://images.unsplash.com/photo-1572099107898-46f22b3af4f9?auto=format&fit=crop&w=900&q=80',
  800, true, 4.7, 41, 15, true, false, false,
  ARRAY['Viande','Oignon','Épices','Pâte'], ARRAY['Beef','Onion','Spices','Pastry']
),
(
  'prod-teranga-frites', 'teranga-restaurant', 'TerangaRestaurant', 'cat-accompagnements',
  'Frites Maison', 'Homemade Fries',
  'Frites dorées et croustillantes préparées à la commande.',
  'Golden crispy fries prepared to order.',
  'https://images.unsplash.com/photo-1529259266118-cf22737f713f?auto=format&fit=crop&w=900&q=80',
  700, true, 4.6, 38, 12, false, false, false,
  ARRAY['Pomme de terre','Sel'], ARRAY['Potato','Salt']
),
(
  'prod-teranga-burger', 'teranga-restaurant', 'TerangaRestaurant', 'cat-snacks',
  'Burger Poulet', 'Chicken Burger',
  'Burger au poulet croustillant avec salade et sauce maison.',
  'Crispy chicken burger with salad and house sauce.',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
  1500, true, 4.7, 49, 18, false, true, false,
  ARRAY['Poulet','Pain','Salade','Tomate','Sauce'], ARRAY['Chicken','Bun','Lettuce','Tomato','Sauce']
),
(
  'prod-teranga-juice', 'teranga-restaurant', 'TerangaRestaurant', 'cat-accompagnements',
  'Jus de Bissap', 'Bissap Juice',
  'Boisson fraîche à base d’hibiscus, légèrement sucrée et parfumée.',
  'Refreshing hibiscus drink, lightly sweetened and aromatic.',
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80',
  500, true, 4.8, 67, 5, false, true, false,
  ARRAY['Bissap','Sucre','Menthe'], ARRAY['Hibiscus','Sugar','Mint']
)
ON CONFLICT (id) DO UPDATE SET
  restaurant_id = EXCLUDED.restaurant_id,
  restaurant_name = EXCLUDED.restaurant_name,
  category_id = EXCLUDED.category_id,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  image_url = EXCLUDED.image_url,
  price = EXCLUDED.price,
  available = EXCLUDED.available,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  prep_time_minutes = EXCLUDED.prep_time_minutes,
  is_spicy = EXCLUDED.is_spicy,
  is_popular = EXCLUDED.is_popular,
  is_signature = EXCLUDED.is_signature,
  ingredients_fr = EXCLUDED.ingredients_fr,
  ingredients_en = EXCLUDED.ingredients_en;
