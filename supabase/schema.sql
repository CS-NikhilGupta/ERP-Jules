-- 1. Create Tables

-- Stores Table
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Catalog (Products)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  finish TEXT,
  price_retail NUMERIC(10, 2) NOT NULL,
  price_dealer NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory (Link between Store and Product)
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stock_warehouse INTEGER DEFAULT 0,
  stock_showroom INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, product_id)
);

-- Profiles (Extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('admin', 'sales', 'warehouse')) DEFAULT 'sales',
  store_id UUID REFERENCES stores(id),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  customer_info JSONB, -- { name, phone, address }
  total NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert Seed Data

-- Insert Stores
INSERT INTO stores (id, name, address, logo_url) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lumina Downtown', '123 Main St, Downtown, NY 10001', 'https://images.unsplash.com/photo-1594967839352-87f54c98031a?auto=format&fit=crop&q=80&w=200'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Lumina Uptown', '456 High St, Uptown, NY 10022', 'https://images.unsplash.com/photo-1594967839352-87f54c98031a?auto=format&fit=crop&q=80&w=200');

-- Insert Products (Master Catalog)
INSERT INTO products (sku, name, image_url, category, finish, price_retail, price_dealer) VALUES
('LGT-001', 'Crystal Chandelier', 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=2515&auto=format&fit=crop', 'Chandelier', 'Gold', 1200.00, 600.00),
('LGT-002', 'Vintage Wall Sconce', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=2670&auto=format&fit=crop', 'Sconce', 'Brass', 250.00, 125.00),
('LGT-003', 'Modern Pendant Light', 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?q=80&w=2535&auto=format&fit=crop', 'Pendant', 'Black', 350.00, 175.00),
('LGT-004', 'Industrial Floor Lamp', 'https://images.unsplash.com/photo-1513506003013-0806a55a304d?q=80&w=2670&auto=format&fit=crop', 'Floor Lamp', 'Nickel', 450.00, 225.00),
('LGT-005', 'Art Deco Table Lamp', 'https://images.unsplash.com/photo-1534349762913-961123f206f3?q=80&w=2538&auto=format&fit=crop', 'Table Lamp', 'Chrome', 180.00, 90.00);

-- Insert Inventory for Store A (Downtown)
INSERT INTO inventory (store_id, product_id, stock_warehouse, stock_showroom)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', id, 15, 2 FROM products WHERE sku = 'LGT-001';

INSERT INTO inventory (store_id, product_id, stock_warehouse, stock_showroom)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', id, 45, 5 FROM products WHERE sku = 'LGT-002';

INSERT INTO inventory (store_id, product_id, stock_warehouse, stock_showroom)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', id, 30, 4 FROM products WHERE sku = 'LGT-003';

INSERT INTO inventory (store_id, product_id, stock_warehouse, stock_showroom)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', id, 10, 1 FROM products WHERE sku = 'LGT-004';

INSERT INTO inventory (store_id, product_id, stock_warehouse, stock_showroom)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', id, 20, 3 FROM products WHERE sku = 'LGT-005';

-- Insert Inventory for Store B (Uptown) - Different stock levels
INSERT INTO inventory (store_id, product_id, stock_warehouse, stock_showroom)
SELECT 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', id, 5, 0 FROM products WHERE sku = 'LGT-001'; -- Low stock

INSERT INTO inventory (store_id, product_id, stock_warehouse, stock_showroom)
SELECT 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', id, 100, 20 FROM products WHERE sku = 'LGT-002'; -- High stock

-- Enable RLS (Optional for MVP but good practice)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Simple Policies for MVP (Open for authenticated users)
CREATE POLICY "Public Read Stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Authenticated Read Inventory" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated Update Inventory" ON inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated Insert Inventory" ON inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
-- Allow all authenticated to read/write orders for now
CREATE POLICY "Auth Read Orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Insert Orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
