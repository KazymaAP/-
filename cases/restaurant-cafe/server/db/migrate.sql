-- Restaurant La Cucina — Database Migration
-- Run: psql -U postgres -f migrate.sql

-- ============================================
-- Menu Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price > 0),
  weight INTEGER CHECK (weight > 0),
  calories INTEGER CHECK (calories >= 0),
  category VARCHAR(50) NOT NULL,
  image_url VARCHAR(500),
  available BOOLEAN DEFAULT true,
  badge VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_available ON menu_items(available);

-- ============================================
-- Bookings Table
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time VARCHAR(5) NOT NULL,
  guests INTEGER NOT NULL CHECK (guests > 0 AND guests <= 20),
  table_id VARCHAR(10) NOT NULL,
  table_seats INTEGER,
  table_location VARCHAR(50),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  wishes TEXT,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_slot ON bookings(date, time, table_id) WHERE status = 'confirmed';

-- ============================================
-- Delivery Orders Table
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_orders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  items JSONB NOT NULL,
  total INTEGER NOT NULL CHECK (total > 0),
  delivery_fee INTEGER DEFAULT 0,
  grand_total INTEGER NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  wishes TEXT,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled')),
  estimated_delivery VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON delivery_orders(created_at);

-- ============================================
-- Guests (Loyalty Program)
-- ============================================
CREATE TABLE IF NOT EXISTS guests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(200),
  loyalty_points INTEGER DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_visit TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);

-- ============================================
-- Reviews Table
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  guest_id INTEGER REFERENCES guests(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  source VARCHAR(50) DEFAULT 'site',
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);

-- ============================================
-- Audit Log
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
