-- ==============================================================================
-- CEYVISTA ENGINEERING — WIPE ALL TICKETS & RESET NUMBERING TO WO-2026-0001
-- ==============================================================================

-- 1. Remove all old/test tickets, photos, comments, history, and notifications
TRUNCATE TABLE work_order_status_history CASCADE;
TRUNCATE TABLE work_order_comments CASCADE;
TRUNCATE TABLE work_order_photos CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE work_orders CASCADE;

-- 2. Reset the ticket number sequence back to 1 (Next ticket: WO-2026-0001)
CREATE SEQUENCE IF NOT EXISTS work_order_seq START 1;
ALTER SEQUENCE work_order_seq RESTART WITH 1;

-- 3. Ensure all latest columns exist (Multi-Hotel & Photo Uploads)
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS hotel_name TEXT NOT NULL DEFAULT 'ME Colombo';

ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS after_photo_url TEXT;

-- 4. Enable Supabase Realtime Live Sync
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
