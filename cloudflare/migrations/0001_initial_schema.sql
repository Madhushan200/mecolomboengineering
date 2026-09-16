-- =============================================================================
-- Migration: 0001_initial_schema.sql
-- Application: ME Colombo Engineering (Ceyvista Engineering)
-- Source: Supabase PostgreSQL (schema.sql)
-- Target: Cloudflare D1 (SQLite)
--
-- Notes:
-- 1. UUIDs are stored as canonical 36-char TEXT.
-- 2. Timestamps are formatted as ISO 8601 UTC strings (TEXT).
-- 3. Booleans are stored as INTEGER (1 = true, 0 = false) with CHECK constraints.
-- 4. Foreign keys are enforced with CASCADE and SET NULL clauses.
-- 5. Indexes added for high-throughput query optimization.
-- =============================================================================

PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------------
-- 1. Table: departments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    icon TEXT,
    active INTEGER DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);

-- -----------------------------------------------------------------------------
-- 2. Table: profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'ENGINEERING', 'EXECUTIVE', 'TECHNICIAN')),
    department TEXT NOT NULL,
    phone TEXT,
    active INTEGER DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);

-- -----------------------------------------------------------------------------
-- 3. Table: technicians
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technicians (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    department TEXT DEFAULT 'Engineering',
    specialization TEXT NOT NULL,
    phone TEXT,
    active INTEGER DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_technicians_active ON technicians(active);
CREATE INDEX IF NOT EXISTS idx_technicians_specialization ON technicians(specialization);

-- -----------------------------------------------------------------------------
-- 4. Table: system_settings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY NOT NULL,
    hotel_name TEXT NOT NULL DEFAULT 'ME Colombo Hotel',
    hotel_logo TEXT,
    hotel_address TEXT DEFAULT 'No. 16, Park Road, Havelock Town, Colombo 05, Sri Lanka',
    hotel_contact_email TEXT DEFAULT 'engineering@mecolombo.com',
    hotel_contact_phone TEXT DEFAULT '+94 11 765 4321',
    p1_label TEXT DEFAULT 'P1 – EMERGENCY 🔴',
    p2_label TEXT DEFAULT 'P2 – HIGH 🟠',
    p3_label TEXT DEFAULT 'P3 – NORMAL 🟡',
    p4_label TEXT DEFAULT 'P4 – PLANNED 🟢',
    sound_alert_enabled INTEGER DEFAULT 1 CHECK (sound_alert_enabled IN (0, 1)),
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- -----------------------------------------------------------------------------
-- 5. Table: work_orders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_orders (
    id TEXT PRIMARY KEY NOT NULL,
    work_order_number TEXT NOT NULL UNIQUE,
    reported_by TEXT NOT NULL,
    reported_by_id TEXT,
    department_id TEXT,
    department_name TEXT NOT NULL,
    location TEXT NOT NULL,
    room_number TEXT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    after_photo_url TEXT,
    guest_affected INTEGER DEFAULT 0 CHECK (guest_affected IN (0, 1)),
    priority TEXT NOT NULL CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
    suggested_priority TEXT CHECK (suggested_priority IS NULL OR suggested_priority IN ('P1', 'P2', 'P3', 'P4')),
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'ACCEPTED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CLOSED')),
    assigned_technician_id TEXT,
    assigned_technician_name TEXT,
    reported_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    accepted_at TEXT,
    started_at TEXT,
    waiting_at TEXT,
    completed_at TEXT,
    closed_at TEXT,
    accepted_by TEXT,
    closed_by TEXT,
    waiting_reason TEXT,
    work_done TEXT,
    completion_note TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    hotel_name TEXT NOT NULL DEFAULT 'ME Colombo',
    FOREIGN KEY (reported_by_id) REFERENCES profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_technician_id) REFERENCES technicians(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_work_orders_number ON work_orders(work_order_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_work_orders_hotel_name ON work_orders(hotel_name);
CREATE INDEX IF NOT EXISTS idx_work_orders_reported_at ON work_orders(reported_at);
CREATE INDEX IF NOT EXISTS idx_work_orders_reported_by_id ON work_orders(reported_by_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_dept_id ON work_orders(department_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_tech ON work_orders(assigned_technician_id);

-- -----------------------------------------------------------------------------
-- 6. Table: work_order_photos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_order_photos (
    id TEXT PRIMARY KEY NOT NULL,
    work_order_id TEXT,
    photo_url TEXT NOT NULL,
    photo_type TEXT DEFAULT 'before' CHECK (photo_type IN ('before', 'during', 'after')),
    caption TEXT,
    uploaded_by TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_work_order_photos_wo_id ON work_order_photos(work_order_id);

-- -----------------------------------------------------------------------------
-- 7. Table: work_order_comments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_order_comments (
    id TEXT PRIMARY KEY NOT NULL,
    work_order_id TEXT,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_work_order_comments_wo_id ON work_order_comments(work_order_id);

-- -----------------------------------------------------------------------------
-- 8. Table: work_order_status_history
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_order_status_history (
    id TEXT PRIMARY KEY NOT NULL,
    work_order_id TEXT,
    status TEXT NOT NULL,
    timestamp TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    actor_name TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wo_status_history_wo_id ON work_order_status_history(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_status_history_timestamp ON work_order_status_history(timestamp);

-- -----------------------------------------------------------------------------
-- 9. Table: notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY NOT NULL,
    work_order_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read INTEGER DEFAULT 0 CHECK (is_read IN (0, 1)),
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_wo_id ON notifications(work_order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
