-- =============================================================================
-- Migration: 0003_update_photo_urls.sql
-- Application: ME Colombo Engineering (Ceyvista Engineering)
-- Description: Update work_orders and work_order_photos to point to Cloudflare Worker R2 endpoints
-- Worker Base: https://me-engineering-api.madhushan875.workers.dev
-- =============================================================================

-- 1. WO-2026-0054
UPDATE work_orders
SET photo_url = 'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0054_before.jpg'
WHERE work_order_number = 'WO-2026-0054';

INSERT OR IGNORE INTO work_order_photos (id, work_order_id, photo_url, photo_type, caption, uploaded_by, created_at)
VALUES (
    'photo-wo-0054-before',
    '3b3e95db-ebda-4628-87cd-3f505051c078',
    'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0054_before.jpg',
    'before',
    'Wifi router detach issue',
    'Hafsa',
    '2026-02-28T09:12:00.000Z'
);

-- 2. WO-2026-0052
UPDATE work_orders
SET photo_url = 'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0052_before.jpg'
WHERE work_order_number = 'WO-2026-0052';

INSERT OR IGNORE INTO work_order_photos (id, work_order_id, photo_url, photo_type, caption, uploaded_by, created_at)
VALUES (
    'photo-wo-0052-before',
    'fc720de5-5144-42cb-b0ac-6a29c11a1a49',
    'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0052_before.jpg',
    'before',
    'Wall art light not working',
    'Nuha',
    '2026-02-28T08:30:00.000Z'
);

-- 3. WO-2026-0048
UPDATE work_orders
SET after_photo_url = 'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0048_after.jpg'
WHERE work_order_number = 'WO-2026-0048';

INSERT OR IGNORE INTO work_order_photos (id, work_order_id, photo_url, photo_type, caption, uploaded_by, created_at)
VALUES (
    'photo-wo-0048-after',
    '5560ee55-352c-4e0a-a8af-e1c87546a2f0',
    'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0048_after.jpg',
    'after',
    'Restaurant outside AC repaired',
    'Engineering Team',
    '2026-02-28T07:15:00.000Z'
);

-- 4. WO-2026-0046
UPDATE work_orders
SET photo_url = 'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0046_before.jpg'
WHERE work_order_number = 'WO-2026-0046';

INSERT OR IGNORE INTO work_order_photos (id, work_order_id, photo_url, photo_type, caption, uploaded_by, created_at)
VALUES (
    'photo-wo-0046-before',
    '23e8bdfb-a266-4a06-b0ae-8ada05725ce3',
    'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0046_before.jpg',
    'before',
    'Ice Machine issue',
    'Nuha',
    '2026-02-28T06:00:00.000Z'
);

-- 5. WO-2026-0050
UPDATE work_orders
SET photo_url = 'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0050_before.jpg',
    after_photo_url = 'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0050_after.jpg'
WHERE work_order_number = 'WO-2026-0050';

INSERT OR IGNORE INTO work_order_photos (id, work_order_id, photo_url, photo_type, caption, uploaded_by, created_at)
VALUES (
    'photo-wo-0050-before',
    'bf169e08-ead0-4c57-bdf6-019bbc848997',
    'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0050_before.jpg',
    'before',
    '24000BTU AC outdoor unit 6th floor before service',
    'Chamod',
    '2026-02-28T07:45:00.000Z'
),
(
    'photo-wo-0050-after',
    'bf169e08-ead0-4c57-bdf6-019bbc848997',
    'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0050_after.jpg',
    'after',
    '24000BTU AC outdoor unit 6th floor serviced',
    'Chamod',
    '2026-02-28T08:15:00.000Z'
);

-- 6. WO-2026-0049
UPDATE work_orders
SET photo_url = 'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0049_before.jpg',
    after_photo_url = 'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0049_after.jpg'
WHERE work_order_number = 'WO-2026-0049';

INSERT OR IGNORE INTO work_order_photos (id, work_order_id, photo_url, photo_type, caption, uploaded_by, created_at)
VALUES (
    'photo-wo-0049-before',
    '29c4f176-e983-4860-b8d5-a011f33eb9f7',
    'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0049_before.jpg',
    'before',
    'Desk needing polish',
    'Nuha',
    '2026-02-28T07:30:00.000Z'
),
(
    'photo-wo-0049-after',
    '29c4f176-e983-4860-b8d5-a011f33eb9f7',
    'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0049_after.jpg',
    'after',
    'Desk polished completely',
    'Chamod',
    '2026-02-28T08:00:00.000Z'
);

-- 7. WO-2026-0057
UPDATE work_orders
SET photo_url = 'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0057_before.jpg'
WHERE work_order_number = 'WO-2026-0057';

INSERT OR IGNORE INTO work_order_photos (id, work_order_id, photo_url, photo_type, caption, uploaded_by, created_at)
VALUES (
    'photo-wo-0057-before',
    'da6fc86b-a1ec-4402-920b-37c311914de4',
    'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0057_before.jpg',
    'before',
    'Kitchen food trolley wheel issue',
    'Hafsa',
    '2026-02-28T10:00:00.000Z'
);

-- 8. WO-2026-0058
UPDATE work_orders
SET photo_url = 'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0058_before.jpg'
WHERE work_order_number = 'WO-2026-0058';

INSERT OR IGNORE INTO work_order_photos (id, work_order_id, photo_url, photo_type, caption, uploaded_by, created_at)
VALUES (
    'photo-wo-0058-before',
    '29063777-2cad-445c-96e1-71668609f0ad',
    'https://me-engineering-api.madhushan875.workers.dev/api/photos/WO-2026-0058_before.jpg',
    'before',
    'Paint touch ups required',
    'Nuha',
    '2026-02-28T10:30:00.000Z'
);
