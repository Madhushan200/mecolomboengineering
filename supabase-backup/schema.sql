-- ========================================================
-- Supabase Database Schema Dump
-- Generated on: 2026-09-14T04:30:42.140Z
-- Project: fdpemolavetvusapcuek
-- ========================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- --------------------------------------------------------
-- Extensions
-- --------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- --------------------------------------------------------
-- Functions
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_wo_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  current_year TEXT;
  seq_num TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq_num := LPAD(nextval('work_order_seq')::TEXT, 4, '0');
  NEW.work_order_number := 'WO-' || current_year || '-' || seq_num;
  RETURN NEW;
END;
$function$
;

-- --------------------------------------------------------
-- Table: public.departments
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "name" text NOT NULL,
    "code" text NOT NULL,
    "icon" text,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now()
);

-- --------------------------------------------------------
-- Table: public.notifications
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "work_order_id" uuid,
    "title" text NOT NULL,
    "message" text NOT NULL,
    "type" text NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now()
);

-- --------------------------------------------------------
-- Table: public.profiles
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "role" text NOT NULL,
    "department" text NOT NULL,
    "phone" text,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- --------------------------------------------------------
-- Table: public.system_settings
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "hotel_name" text DEFAULT 'ME Colombo Hotel'::text NOT NULL,
    "hotel_logo" text,
    "hotel_address" text DEFAULT 'No. 16, Park Road, Havelock Town, Colombo 05, Sri Lanka'::text,
    "hotel_contact_email" text DEFAULT 'engineering@mecolombo.com'::text,
    "hotel_contact_phone" text DEFAULT '+94 11 765 4321'::text,
    "p1_label" text DEFAULT 'P1 – EMERGENCY 🔴'::text,
    "p2_label" text DEFAULT 'P2 – HIGH 🟠'::text,
    "p3_label" text DEFAULT 'P3 – NORMAL 🟡'::text,
    "p4_label" text DEFAULT 'P4 – PLANNED 🟢'::text,
    "sound_alert_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- --------------------------------------------------------
-- Table: public.technicians
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."technicians" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "name" text NOT NULL,
    "department" text DEFAULT 'Engineering'::text,
    "specialization" text NOT NULL,
    "phone" text,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now()
);

-- --------------------------------------------------------
-- Table: public.work_order_comments
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."work_order_comments" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "work_order_id" uuid,
    "user_name" text NOT NULL,
    "user_role" text NOT NULL,
    "message" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);

-- --------------------------------------------------------
-- Table: public.work_order_photos
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."work_order_photos" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "work_order_id" uuid,
    "photo_url" text NOT NULL,
    "photo_type" text DEFAULT 'before'::text,
    "caption" text,
    "uploaded_by" text,
    "created_at" timestamp with time zone DEFAULT now()
);

-- --------------------------------------------------------
-- Table: public.work_order_status_history
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."work_order_status_history" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "work_order_id" uuid,
    "status" text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    "actor_name" text NOT NULL,
    "note" text
);

-- --------------------------------------------------------
-- Table: public.work_orders
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."work_orders" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "work_order_number" text NOT NULL,
    "reported_by" text NOT NULL,
    "reported_by_id" uuid,
    "department_id" uuid,
    "department_name" text NOT NULL,
    "location" text NOT NULL,
    "room_number" text,
    "category" text NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "photo_url" text,
    "after_photo_url" text,
    "guest_affected" boolean DEFAULT false,
    "priority" text NOT NULL,
    "suggested_priority" text,
    "status" text DEFAULT 'NEW'::text NOT NULL,
    "assigned_technician_id" uuid,
    "assigned_technician_name" text,
    "reported_at" timestamp with time zone DEFAULT now(),
    "accepted_at" timestamp with time zone,
    "started_at" timestamp with time zone,
    "waiting_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "accepted_by" text,
    "closed_by" text,
    "waiting_reason" text,
    "work_done" text,
    "completion_note" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "hotel_name" text DEFAULT 'ME Colombo'::text NOT NULL
);

-- --------------------------------------------------------
-- Constraints
-- --------------------------------------------------------

ALTER TABLE ONLY "public"."departments"
    DROP CONSTRAINT IF EXISTS "departments_pkey",
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "public"."notifications"
    DROP CONSTRAINT IF EXISTS "notifications_pkey",
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "public"."profiles"
    DROP CONSTRAINT IF EXISTS "profiles_pkey",
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "public"."system_settings"
    DROP CONSTRAINT IF EXISTS "system_settings_pkey",
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "public"."technicians"
    DROP CONSTRAINT IF EXISTS "technicians_pkey",
    ADD CONSTRAINT "technicians_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "public"."work_order_comments"
    DROP CONSTRAINT IF EXISTS "work_order_comments_pkey",
    ADD CONSTRAINT "work_order_comments_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "public"."work_order_photos"
    DROP CONSTRAINT IF EXISTS "work_order_photos_pkey",
    ADD CONSTRAINT "work_order_photos_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "public"."work_order_status_history"
    DROP CONSTRAINT IF EXISTS "work_order_status_history_pkey",
    ADD CONSTRAINT "work_order_status_history_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "public"."work_orders"
    DROP CONSTRAINT IF EXISTS "work_orders_pkey",
    ADD CONSTRAINT "work_orders_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "public"."departments"
    DROP CONSTRAINT IF EXISTS "departments_code_key",
    ADD CONSTRAINT "departments_code_key" UNIQUE (code);

ALTER TABLE ONLY "public"."profiles"
    DROP CONSTRAINT IF EXISTS "profiles_email_key",
    ADD CONSTRAINT "profiles_email_key" UNIQUE (email);

ALTER TABLE ONLY "public"."work_orders"
    DROP CONSTRAINT IF EXISTS "work_orders_work_order_number_key",
    ADD CONSTRAINT "work_orders_work_order_number_key" UNIQUE (work_order_number);

ALTER TABLE ONLY "public"."profiles"
    DROP CONSTRAINT IF EXISTS "profiles_role_check",
    ADD CONSTRAINT "profiles_role_check" CHECK (role = ANY (ARRAY['ADMIN'::text, 'ENGINEERING'::text, 'EXECUTIVE'::text, 'TECHNICIAN'::text]));

ALTER TABLE ONLY "public"."work_order_photos"
    DROP CONSTRAINT IF EXISTS "work_order_photos_photo_type_check",
    ADD CONSTRAINT "work_order_photos_photo_type_check" CHECK (photo_type = ANY (ARRAY['before'::text, 'during'::text, 'after'::text]));

ALTER TABLE ONLY "public"."work_orders"
    DROP CONSTRAINT IF EXISTS "work_orders_priority_check",
    ADD CONSTRAINT "work_orders_priority_check" CHECK (priority = ANY (ARRAY['P1'::text, 'P2'::text, 'P3'::text, 'P4'::text]));

ALTER TABLE ONLY "public"."work_orders"
    DROP CONSTRAINT IF EXISTS "work_orders_status_check",
    ADD CONSTRAINT "work_orders_status_check" CHECK (status = ANY (ARRAY['NEW'::text, 'ACCEPTED'::text, 'IN_PROGRESS'::text, 'WAITING'::text, 'COMPLETED'::text, 'CLOSED'::text]));

ALTER TABLE ONLY "public"."work_orders"
    DROP CONSTRAINT IF EXISTS "work_orders_suggested_priority_check",
    ADD CONSTRAINT "work_orders_suggested_priority_check" CHECK (suggested_priority = ANY (ARRAY['P1'::text, 'P2'::text, 'P3'::text, 'P4'::text]));

ALTER TABLE ONLY "public"."notifications"
    DROP CONSTRAINT IF EXISTS "notifications_work_order_id_fkey",
    ADD CONSTRAINT "notifications_work_order_id_fkey" FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."work_order_comments"
    DROP CONSTRAINT IF EXISTS "work_order_comments_work_order_id_fkey",
    ADD CONSTRAINT "work_order_comments_work_order_id_fkey" FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."work_order_photos"
    DROP CONSTRAINT IF EXISTS "work_order_photos_work_order_id_fkey",
    ADD CONSTRAINT "work_order_photos_work_order_id_fkey" FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."work_order_status_history"
    DROP CONSTRAINT IF EXISTS "work_order_status_history_work_order_id_fkey",
    ADD CONSTRAINT "work_order_status_history_work_order_id_fkey" FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."work_orders"
    DROP CONSTRAINT IF EXISTS "work_orders_assigned_technician_id_fkey",
    ADD CONSTRAINT "work_orders_assigned_technician_id_fkey" FOREIGN KEY (assigned_technician_id) REFERENCES technicians(id) ON DELETE SET NULL;

ALTER TABLE ONLY "public"."work_orders"
    DROP CONSTRAINT IF EXISTS "work_orders_department_id_fkey",
    ADD CONSTRAINT "work_orders_department_id_fkey" FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE ONLY "public"."work_orders"
    DROP CONSTRAINT IF EXISTS "work_orders_reported_by_id_fkey",
    ADD CONSTRAINT "work_orders_reported_by_id_fkey" FOREIGN KEY (reported_by_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- --------------------------------------------------------
-- Row Level Security (RLS)
-- --------------------------------------------------------


-- --------------------------------------------------------
-- Triggers
-- --------------------------------------------------------

DROP TRIGGER IF EXISTS "trigger_set_wo_number" ON "public"."work_orders";
CREATE TRIGGER "trigger_set_wo_number"
    BEFORE INSERT ON "public"."work_orders"
    FOR EACH ROW
    EXECUTE FUNCTION generate_wo_number();

-- --------------------------------------------------------
-- Realtime Publication
-- --------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE "public"."work_orders";
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."notifications";

-- --------------------------------------------------------
-- Grants
-- --------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

