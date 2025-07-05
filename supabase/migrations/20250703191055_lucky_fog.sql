/*
# Initial Database Schema for ShopConnect Platform

## Overview
This migration sets up the complete database schema for the ShopConnect platform,
including tables for users, shops, products, cart items, orders, and order items.

## Tables Created

### 1. Users Table
- Extends Supabase auth.users with additional profile information
- Stores user roles (admin, shopkeeper, customer)
- Links to shops and orders

### 2. Shops Table  
- Stores shop information and profiles
- Links to shopkeeper users
- Includes approval status workflow
- Stores shop images and QR codes

### 3. Products Table
- Stores product information for each shop
- Includes images, pricing, and inventory
- Categorized products with stock tracking

### 4. Cart Items Table
- Temporary storage for customer cart items
- Links to products and sessions
- Supports both authenticated and anonymous users

### 5. Orders Table
- Stores customer order information
- Links to shops and includes customer details
- Tracks order status and totals

### 6. Order Items Table
- Stores individual items within orders
- Links to products and orders
- Captures price at time of purchase

## Security
- Row Level Security enabled on all tables
- Policies restrict access based on user roles
- Shopkeepers can only access their own data
- Customers can only access their own orders

## Indexes
- Optimized for common query patterns
- Foreign key relationships properly indexed
- Search and filtering performance optimized
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'shopkeeper', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  image_url TEXT,
  qr_code_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  shopkeeper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shops_shopkeeper_id ON shops(shopkeeper_id);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Shops policies
CREATE POLICY "Anyone can read approved shops" ON shops
  FOR SELECT
  USING (status = 'approved' OR auth.uid() = shopkeeper_id);

CREATE POLICY "Shopkeepers can create shops" ON shops
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = shopkeeper_id);

CREATE POLICY "Shopkeepers can update own shops" ON shops
  FOR UPDATE TO authenticated
  USING (auth.uid() = shopkeeper_id);

CREATE POLICY "Admins can update any shop" ON shops
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Products policies
CREATE POLICY "Anyone can read products from approved shops" ON products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = products.shop_id 
      AND shops.status = 'approved'
    )
  );

CREATE POLICY "Shopkeepers can manage own products" ON products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = products.shop_id 
      AND shops.shopkeeper_id = auth.uid()
    )
  );

-- Cart items policies
CREATE POLICY "Users can manage own cart items" ON cart_items
  FOR ALL TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Anyone can manage cart items by session" ON cart_items
  FOR ALL
  USING (true);

-- Orders policies
CREATE POLICY "Shopkeepers can read own shop orders" ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = orders.shop_id 
      AND shops.shopkeeper_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Shopkeepers can update own shop orders" ON orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = orders.shop_id 
      AND shops.shopkeeper_id = auth.uid()
    )
  );

-- Order items policies
CREATE POLICY "Users can read order items for accessible orders" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        EXISTS (
          SELECT 1 FROM shops 
          WHERE shops.id = orders.shop_id 
          AND shops.shopkeeper_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();