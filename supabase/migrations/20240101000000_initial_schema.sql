-- ============================================================
-- PhotoBuddy - Initial Database Schema
-- Migration: 20240101000000_initial_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('anonymous', 'free_user', 'premium_user', 'admin');
CREATE TYPE subscription_status AS ENUM ('free', 'premium', 'cancelled_pending');
CREATE TYPE ai_analysis_status AS ENUM ('pending', 'processing', 'complete', 'failed');
CREATE TYPE report_category AS ENUM ('spam', 'harassment', 'nudity', 'illegal_content', 'other');
CREATE TYPE moderation_action AS ENUM ('dismissed', 'content_removed', 'user_warned', 'user_banned');

-- ============================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  website TEXT,
  role user_role NOT NULL DEFAULT 'free_user',

  -- Subscription
  subscription_status subscription_status NOT NULL DEFAULT 'free',
  subscription_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,

  -- Username change tracking
  username_changed_at TIMESTAMPTZ,
  previous_username TEXT,
  previous_username_released_at TIMESTAMPTZ,

  -- Account status
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,

  -- Upload tracking (free tier)
  monthly_upload_count INTEGER NOT NULL DEFAULT 0,
  upload_count_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()) + INTERVAL '1 month',

  -- Data management
  deletion_requested_at TIMESTAMPTZ,
  data_export_requested_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE public.users
  ADD CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 30),
  ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  ADD CONSTRAINT display_name_length CHECK (char_length(display_name) BETWEEN 1 AND 50),
  ADD CONSTRAINT bio_length CHECK (char_length(bio) <= 300),
  ADD CONSTRAINT website_format CHECK (website IS NULL OR website ~ '^https?://'),
  ADD CONSTRAINT subscription_period_end_requires_status CHECK (
    subscription_period_end IS NULL OR subscription_status IN ('premium', 'cancelled_pending')
  );

-- Indexes
CREATE INDEX idx_users_username ON public.users (username);
CREATE INDEX idx_users_role ON public.users (role);
CREATE INDEX idx_users_subscription_status ON public.users (subscription_status);
CREATE INDEX idx_users_stripe_customer_id ON public.users (stripe_customer_id);
CREATE INDEX idx_users_is_banned ON public.users (is_banned);
CREATE INDEX idx_users_deletion_requested_at ON public.users (deletion_requested_at) WHERE deletion_requested_at IS NOT NULL;

-- ============================================================
-- PHOTOS TABLE
-- ============================================================

CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Content
  title TEXT,
  description TEXT,
  cloudinary_public_id TEXT NOT NULL UNIQUE,
  cloudinary_url TEXT NOT NULL,

  -- EXIF metadata (GPS stripped)
  exif_camera TEXT,
  exif_lens TEXT,
  exif_focal_length TEXT,
  exif_aperture TEXT,
  exif_shutter_speed TEXT,
  exif_iso INTEGER,
  exif_taken_at TIMESTAMPTZ,

  -- Counts (denormalized for performance)
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,

  -- AI analysis
  ai_status ai_analysis_status NOT NULL DEFAULT 'pending',
  ai_tags TEXT[] DEFAULT '{}',
  ai_feedback TEXT,
  ai_captions TEXT[],
  ai_raw_response JSONB,
  ai_processed_at TIMESTAMPTZ,
  ai_retry_count INTEGER NOT NULL DEFAULT 0,
  ai_error_message TEXT,

  -- Moderation
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id),
  is_removed_by_admin BOOLEAN NOT NULL DEFAULT FALSE,

  -- Full-text search
  search_vector TSVECTOR,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE public.photos
  ADD CONSTRAINT title_length CHECK (title IS NULL OR char_length(title) <= 100),
  ADD CONSTRAINT description_length CHECK (description IS NULL OR char_length(description) <= 2000),
  ADD CONSTRAINT ai_retry_count_max CHECK (ai_retry_count <= 3);

-- Indexes
CREATE INDEX idx_photos_user_id ON public.photos (user_id);
CREATE INDEX idx_photos_created_at ON public.photos (created_at DESC);
CREATE INDEX idx_photos_is_deleted ON public.photos (is_deleted);
CREATE INDEX idx_photos_ai_status ON public.photos (ai_status) WHERE is_deleted = FALSE;
CREATE INDEX idx_photos_like_count ON public.photos (like_count DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_photos_search_vector ON public.photos USING GIN (search_vector);
CREATE INDEX idx_photos_ai_tags ON public.photos USING GIN (ai_tags);
CREATE INDEX idx_photos_user_not_deleted ON public.photos (user_id, created_at DESC) WHERE is_deleted = FALSE;

-- ============================================================
-- FOLLOWS TABLE (social graph)
-- ============================================================

CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower_id ON public.follows (follower_id);
CREATE INDEX idx_follows_following_id ON public.follows (following_id);

-- ============================================================
-- FOLLOWER / FOLLOWING COUNTS (denormalized on users)
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN follower_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN following_count INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- LIKES TABLE
-- ============================================================

CREATE TABLE public.likes (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, photo_id)
);

CREATE INDEX idx_likes_photo_id ON public.likes (photo_id);
CREATE INDEX idx_likes_user_id ON public.likes (user_id);

-- ============================================================
-- COMMENTS TABLE
-- ============================================================

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comments
  ADD CONSTRAINT body_length CHECK (char_length(body) BETWEEN 1 AND 1000);

CREATE INDEX idx_comments_photo_id ON public.comments (photo_id, created_at ASC) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_user_id ON public.comments (user_id);

-- ============================================================
-- REPORTS TABLE (content moderation)
-- ============================================================

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Polymorphic target (either photo or comment, not both)
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,

  category report_category NOT NULL,
  notes TEXT,

  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  resolution moderation_action,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT report_has_one_target CHECK (
    (photo_id IS NOT NULL AND comment_id IS NULL) OR
    (photo_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_reports_resolved_at ON public.reports (resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_reports_reporter_id ON public.reports (reporter_id);
CREATE INDEX idx_reports_photo_id ON public.reports (photo_id) WHERE photo_id IS NOT NULL;
CREATE INDEX idx_reports_comment_id ON public.reports (comment_id) WHERE comment_id IS NOT NULL;

-- ============================================================
-- STRIPE WEBHOOK EVENTS (idempotency tracking)
-- ============================================================

CREATE TABLE public.stripe_webhook_events (
  id TEXT PRIMARY KEY, -- Stripe event ID
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data JSONB NOT NULL
);

-- ============================================================
-- DATA EXPORT REQUESTS
-- ============================================================

CREATE TABLE public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_data_export_requests_user_id ON public.data_export_requests (user_id);
CREATE INDEX idx_data_export_requests_status ON public.data_export_requests (status) WHERE status IN ('pending', 'processing');

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER photos_updated_at
  BEFORE UPDATE ON public.photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PHOTO SEARCH VECTOR UPDATE FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_photo_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.ai_tags, ' '), '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photos_search_vector_update
  BEFORE INSERT OR UPDATE OF title, description, ai_tags ON public.photos
  FOR EACH ROW EXECUTE FUNCTION update_photo_search_vector();

-- ============================================================
-- FOLLOW COUNT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION increment_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  UPDATE public.users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  UPDATE public.users SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER follows_after_insert
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION increment_follow_counts();

CREATE TRIGGER follows_after_delete
  AFTER DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION decrement_follow_counts();

-- ============================================================
-- LIKE COUNT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.photos SET like_count = like_count + 1 WHERE id = NEW.photo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.photos SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.photo_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER likes_after_insert
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION increment_like_count();

CREATE TRIGGER likes_after_delete
  AFTER DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION decrement_like_count();

-- ============================================================
-- COMMENT COUNT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.photos SET comment_count = comment_count + 1 WHERE id = NEW.photo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.photos SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.photo_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER comments_after_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION increment_comment_count();

CREATE TRIGGER comments_after_delete
  AFTER DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION decrement_comment_count();

-- ============================================================
-- NEW USER PROFILE CREATION TRIGGER
-- Called when a new auth.users row is inserted
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INTEGER := 0;
BEGIN
  -- Derive a base username from email, sanitized
  base_username := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'));
  -- Truncate to 27 chars to allow appending numeric suffix
  base_username := substring(base_username FROM 1 FOR 27);
  -- Ensure minimum length
  IF char_length(base_username) < 3 THEN
    base_username := base_username || '_pb';
  END IF;

  final_username := base_username;

  -- Find a unique username
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO public.users (
    id,
    username,
    display_name,
    role,
    subscription_status
  ) VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', final_username),
    'free_user',
    'free'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- MONTHLY UPLOAD COUNTER RESET FUNCTION
-- To be called by a scheduled job or checked on upload
-- ============================================================

CREATE OR REPLACE FUNCTION reset_monthly_upload_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET
    monthly_upload_count = 0,
    upload_count_reset_at = date_trunc('month', NOW()) + INTERVAL '1 month'
  WHERE upload_count_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER FUNCTION: Check if user is premium
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_premium(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
      AND subscription_status IN ('premium', 'cancelled_pending')
      AND (subscription_period_end IS NULL OR subscription_period_end > NOW())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- HELPER FUNCTION: Check if current user is admin
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: users
-- ============================================================

-- Anyone can view user profiles (all profiles are public)
CREATE POLICY "users_select_public"
  ON public.users
  FOR SELECT
  USING (is_banned = FALSE);

-- Admins can view all users including banned
CREATE POLICY "users_select_admin"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Users can update their own profile
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent self-role escalation
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- Admins can update any user (including banning, role changes)
CREATE POLICY "users_update_admin"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Insert is handled by trigger only (no direct inserts from client)
-- The handle_new_user function runs as SECURITY DEFINER

-- ============================================================
-- RLS POLICIES: photos
-- ============================================================

-- Anyone can view non-deleted, non-admin-removed photos
CREATE POLICY "photos_select_public"
  ON public.photos
  FOR SELECT
  USING (is_deleted = FALSE AND is_removed_by_admin = FALSE);

-- Admins can see all photos including soft-deleted
CREATE POLICY "photos_select_admin"
  ON public.photos
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Authenticated users (free or premium) can insert their own photos
CREATE POLICY "photos_insert_own"
  ON public.photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND is_banned = FALSE
        AND role IN ('free_user', 'premium_user', 'admin')
    )
  );

-- Users can update their own non-deleted photos (title, description, tags)
CREATE POLICY "photos_update_own"
  ON public.photos
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND is_deleted = FALSE)
  WITH CHECK (user_id = auth.uid());

-- Admins can update any photo (for moderation)
CREATE POLICY "photos_update_admin"
  ON public.photos
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Users can soft-delete their own photos (no hard deletes from client)
-- Enforced via UPDATE policy above combined with application logic

-- ============================================================
-- RLS POLICIES: follows
-- ============================================================

-- Anyone can view follow relationships
CREATE POLICY "follows_select_public"
  ON public.follows
  FOR SELECT
  USING (TRUE);

-- Authenticated non-banned users can follow others
CREATE POLICY "follows_insert_own"
  ON public.follows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    follower_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_banned = FALSE
    )
  );

-- Users can only unfollow (delete) their own follow relationships
CREATE POLICY "follows_delete_own"
  ON public.follows
  FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- ============================================================
-- RLS POLICIES: likes
-- ============================================================

-- Anyone can see like counts (likes are public)
CREATE POLICY "likes_select_public"
  ON public.likes
  FOR SELECT
  USING (TRUE);

-- Authenticated non-banned users can like photos
CREATE POLICY "likes_insert_own"
  ON public.likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_banned = FALSE
    )
  );

-- Users can unlike (delete) their own likes
CREATE POLICY "likes_delete_own"
  ON public.likes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: comments
-- ============================================================

-- Anyone can view non-deleted comments
CREATE POLICY "comments_select_public"
  ON public.comments
  FOR SELECT
  USING (is_deleted = FALSE);

-- Admins can see all comments
CREATE POLICY "comments_select_admin"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Authenticated non-banned users can comment
CREATE POLICY "comments_insert_own"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_banned = FALSE
    )
  );

-- Comment authors can soft-delete their own comments
-- Photo owners can soft-delete any comment on their photos
-- Admins can soft-delete any comment
CREATE POLICY "comments_update_delete"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (
    -- Comment author
    user_id = auth.uid()
    -- Photo owner
    OR EXISTS (
      SELECT 1 FROM public.photos
      WHERE photos.id = comments.photo_id
        AND photos.user_id = auth.uid()
    )
    -- Admin
    OR public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: reports
-- ============================================================

-- Users can see their own reports; admins see all
CREATE POLICY "reports_select_own_or_admin"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_id = auth.uid() OR public.is_admin()
  );

-- Authenticated non-banned users can submit reports
CREATE POLICY "reports_insert_own"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_banned = FALSE
    )
  );

-- Only admins can update reports (resolve them)
CREATE POLICY "reports_update_admin"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: stripe_webhook_events
-- ============================================================

-- Only service role / admins access webhook events (no client access)
CREATE POLICY "stripe_webhook_events_admin_only"
  ON public.stripe_webhook_events
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: data_export_requests
-- ============================================================

-- Users can view their own export requests
CREATE POLICY "data_export_requests_select_own"
  ON public.data_export_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- Users can create their own export requests
CREATE POLICY "data_export_requests_insert_own"
  ON public.data_export_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only service role updates export requests (processing status)
CREATE POLICY "data_export_requests_update_admin"
  ON public.data_export_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Grant usage on schema to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on public read tables to anon (browsing without login)
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.photos TO anon;
GRANT SELECT ON public.follows TO anon;
GRANT SELECT ON public.likes TO anon;
GRANT SELECT ON public.comments TO anon;

-- Grant full CRUD to authenticated on their own data (enforced by RLS)
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.photos TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.comments TO authenticated;
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT UPDATE ON public.reports TO authenticated;
GRANT SELECT, INSERT ON public.data_export_requests TO authenticated;
GRANT UPDATE ON public.data_export_requests TO authenticated;
GRANT SELECT ON public.stripe_webhook_events TO authenticated;
