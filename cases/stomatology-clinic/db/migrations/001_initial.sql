-- ============================================
-- ДентаПро — Database Schema
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price_min INTEGER NOT NULL DEFAULT 0,
    price_max INTEGER,
    category VARCHAR(100) NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active) WHERE is_active = true;

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    specialty VARCHAR(200) NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    description TEXT,
    photo_url VARCHAR(500),
    schedule JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_active ON doctors(is_active) WHERE is_active = true;
CREATE INDEX idx_doctors_rating ON doctors(rating DESC);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    patient_name VARCHAR(200) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_email VARCHAR(200),
    comment TEXT,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    service_name VARCHAR(200) NOT NULL,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
    doctor_name VARCHAR(200) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    price INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    confirmation_code VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_doctor ON bookings(doctor_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_phone ON bookings(patient_phone);
CREATE INDEX idx_bookings_code ON bookings(booking_code);

-- Doctor availability table
CREATE TABLE IF NOT EXISTS doctor_availability (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(doctor_id, day_of_week)
);

CREATE INDEX idx_availability_doctor ON doctor_availability(doctor_id);

-- Blocked time slots
CREATE TABLE IF NOT EXISTS blocked_slots (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    block_date DATE NOT NULL,
    block_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    reason VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blocked_doctor_date ON blocked_slots(doctor_id, block_date);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
    patient_name VARCHAR(200) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text TEXT NOT NULL,
    source VARCHAR(50) DEFAULT 'website',
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reviews_doctor ON reviews(doctor_id);
CREATE INDEX idx_reviews_published ON reviews(is_published) WHERE is_published = true;

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);

-- Clinic settings
CREATE TABLE IF NOT EXISTS clinic_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO clinic_settings (key, value, description) VALUES
    ('clinic_name', 'ДентаПро', 'Название клиники'),
    ('phone', '+7 (495) 123-45-67', 'Телефон клиники'),
    ('email', 'info@dentapro.ru', 'Email клиники'),
    ('address', 'ул. Примерная, 12, Москва', 'Адрес клиники'),
    ('working_hours_start', '08:00', 'Время открытия'),
    ('working_hours_end', '21:00', 'Время закрытия'),
    ('slot_duration', '30', 'Длительность слота в минутах')
ON CONFLICT (key) DO NOTHING;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data
INSERT INTO services (name, description, price_min, price_max, category, duration_minutes) VALUES
    ('Лечение кариеса', 'Лечение 1-го канала с пломбой. Гарантия 2 года.', 5000, 15000, 'therapy', 40),
    ('Лечение каналов', 'Эндодонтия с микроскопом. 1-3 канала. Гарантия 3 года.', 8000, 25000, 'therapy', 60),
    ('Восстановление зуба', 'Культевая вкладка + коронка. Восстановление за 2 визита.', 12000, 35000, 'therapy', 45),
    ('Отбел зубов', 'Zoom 4, Air Flow. Результат на 1-2 года.', 15000, 30000, 'aesthetics', 90),
    ('Профессиональная чистка', 'Air Flow + ультразук + полировка + фторирование.', 8000, 12000, 'prevention', 60),
    ('Консультация', 'Осмотр, план лечения, рентген. Без обязательств.', 0, 0, 'prevention', 30)
ON CONFLICT DO NOTHING;

INSERT INTO doctors (first_name, last_name, middle_name, specialty, experience_years, rating, review_count, description) VALUES
    ('Иван', 'Иванов', 'Иванович', 'Терапевт', 12, 4.9, 156, 'Лечение каналов, реставрация, виниры. Использует микроскоп Carl Zeiss.'),
    ('Анна', 'Петрова', 'Сергеевна', 'Ортодонт', 8, 4.8, 98, 'Элайнеры, брекеты, детская ортодонтия. Сертификат Invisalign.'),
    ('Алексей', 'Сидоров', 'Петрович', 'Хирург', 15, 4.9, 210, 'Имплантация, удаление зубов, костная пластика. Навигация для имплантации.')
ON CONFLICT DO NOTHING;
