-- Teranga Eats Dakar Supabase Database Schema
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. PROFILES / USERS
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  language TEXT NOT NULL DEFAULT 'fr',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RESTAURANTS
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  rating NUMERIC(3,2) NOT NULL DEFAULT 4.8,
  review_count INT NOT NULL DEFAULT 0,
  delivery_time TEXT NOT NULL DEFAULT '25-35 min',
  delivery_fee INT NOT NULL DEFAULT 1000,
  min_order INT NOT NULL DEFAULT 2000,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  phone TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  is_halal BOOLEAN NOT NULL DEFAULT TRUE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
  is_partner BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRODUCTS / DISHES
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  name_wo TEXT,
  description TEXT NOT NULL,
  description_en TEXT,
  description_wo TEXT,
  price INT NOT NULL,
  category_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  is_spicy BOOLEAN NOT NULL DEFAULT FALSE,
  is_vegetarian BOOLEAN NOT NULL DEFAULT FALSE,
  preparation_time TEXT NOT NULL DEFAULT '15-20 min',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  restaurant_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  restaurant_logo TEXT,
  restaurant_phone TEXT,
  restaurant_address TEXT,
  driver JSONB,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal INT NOT NULL,
  delivery_fee INT NOT NULL,
  discount INT NOT NULL DEFAULT 0,
  promo_code TEXT,
  total INT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'paid',
  order_status TEXT NOT NULL DEFAULT 'pending',
  delivery_address JSONB NOT NULL,
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- 5. TABLE BOOKINGS
CREATE TABLE IF NOT EXISTS table_bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  restaurant_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  restaurant_address TEXT NOT NULL,
  restaurant_image TEXT,
  restaurant_phone TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  guests INT NOT NULL,
  seating_area TEXT NOT NULL DEFAULT 'indoor',
  special_requests TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  confirmation_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_bookings ENABLE ROW LEVEL SECURITY;

-- Public read access for restaurants and products
CREATE POLICY "Public read for restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Public read for products" ON products FOR SELECT USING (true);

-- Authenticated full access for orders, bookings, and profiles
CREATE POLICY "Full access on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access on table_bookings" ON table_bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access on restaurants" ON restaurants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access on products" ON products FOR ALL USING (true) WITH CHECK (true);
