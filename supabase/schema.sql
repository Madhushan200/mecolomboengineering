-- ==============================================================================
-- HOTEL ENGINEERING REPORTING PORTAL — SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'ENGINEERING', 'EXECUTIVE', 'TECHNICIAN')),
  department TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  icon TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TECHNICIANS
CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department TEXT DEFAULT 'Engineering',
  specialization TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_name TEXT NOT NULL DEFAULT 'ME Colombo',
  hotel_logo TEXT,
  hotel_address TEXT DEFAULT 'No. 16, Park Road, Havelock Town, Colombo 05, Sri Lanka',
  hotel_contact_email TEXT DEFAULT 'engineering@mecolombo.com',
  hotel_contact_phone TEXT DEFAULT '+94 11 765 4321',
  p1_label TEXT DEFAULT 'P1 – EMERGENCY 🔴',
  p2_label TEXT DEFAULT 'P2 – HIGH 🟠',
  p3_label TEXT DEFAULT 'P3 – NORMAL 🟡',
  p4_label TEXT DEFAULT 'P4 – PLANNED 🟢',
  sound_alert_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WORK ORDERS (Specification 25)
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_number TEXT UNIQUE NOT NULL,
  hotel_name TEXT NOT NULL DEFAULT 'ME Colombo',
  reported_by TEXT NOT NULL,
  reported_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  department_name TEXT NOT NULL,
  location TEXT NOT NULL,
  room_number TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  after_photo_url TEXT,
  guest_affected BOOLEAN DEFAULT false,
  priority TEXT NOT NULL CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
  suggested_priority TEXT CHECK (suggested_priority IN ('P1', 'P2', 'P3', 'P4')),
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'ACCEPTED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CLOSED')),
  assigned_technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  assigned_technician_name TEXT,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  waiting_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  accepted_by TEXT,
  closed_by TEXT,
  waiting_reason TEXT,
  work_done TEXT,
  completion_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WORK ORDER STATUS HISTORY (Specification 26)
CREATE TABLE IF NOT EXISTS work_order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  actor_name TEXT NOT NULL,
  note TEXT
);

-- 7. WORK ORDER COMMENTS
CREATE TABLE IF NOT EXISTS work_order_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. WORK ORDER PHOTOS
CREATE TABLE IF NOT EXISTS work_order_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'before' CHECK (photo_type IN ('before', 'during', 'after')),
  caption TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEQUENTIAL WORK ORDER NUMBER GENERATOR (e.g. WO-2026-0001)
CREATE SEQUENCE IF NOT EXISTS work_order_seq START 46;

CREATE OR REPLACE FUNCTION generate_wo_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  seq_num TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq_num := LPAD(nextval('work_order_seq')::TEXT, 4, '0');
  NEW.work_order_number := 'WO-' || current_year || '-' || seq_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_set_wo_number
BEFORE INSERT ON work_orders
FOR EACH ROW
WHEN (NEW.work_order_number IS NULL OR NEW.work_order_number = '')
EXECUTE FUNCTION generate_wo_number();

-- REALTIME PUBLICATION (Safe idempotent block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'work_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

