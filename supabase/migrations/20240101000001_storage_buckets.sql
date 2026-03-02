-- ============================================================
-- Supabase Storage Bucket Configuration
-- Note: Actual bucket creation is done via Supabase dashboard
-- or API. This migration documents the intended configuration.
-- ============================================================

-- PhotoBuddy uses Cloudinary for image storage (not Supabase Storage).
-- This migration is intentionally minimal - only creating a bucket
-- for data exports which are generated server-side.

-- Data exports bucket: private, only accessible by service role
-- Configuration (apply via Supabase dashboard or management API):
--   Bucket name: data-exports
--   Public: false
--   File size limit: 500MB
--   Allowed MIME types: application/zip, application/json

-- No SQL DDL needed for storage buckets in Supabase migrations;
-- storage is configured via the Storage API or dashboard.
-- This file serves as documentation of intended storage configuration.

SELECT 'Storage configuration: use Supabase dashboard to create data-exports bucket (private)' AS note;
