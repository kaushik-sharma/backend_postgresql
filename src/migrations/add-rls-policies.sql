-- ─────────────────────────────────────────────────────────────────────────────
-- SEQUELIZE_META TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public."SequelizeMeta" ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_postgres
  ON public."SequelizeMeta"
  FOR INSERT
  TO postgres
  WITH CHECK (true);

CREATE POLICY select_policy_postgres
  ON public."SequelizeMeta"
  FOR SELECT
  TO postgres
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_app_user
  ON public.users
  FOR INSERT
  TO app_user
  WITH CHECK (true);

CREATE POLICY select_policy_app_user
  ON public.users
  FOR SELECT
  TO app_user
  USING (true);

CREATE POLICY update_policy_app_user
  ON public.users
  FOR UPDATE
  TO app_user
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- USER_DELETION_REQUESTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_app_user
  ON public.user_deletion_requests
  FOR INSERT
  TO app_user
  WITH CHECK (true);

CREATE POLICY select_policy_app_user
  ON public.user_deletion_requests
  FOR SELECT
  TO app_user
  USING (true);

CREATE POLICY delete_policy_app_user
  ON public.user_deletion_requests
  FOR DELETE
  TO app_user
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- SESSIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_app_user
  ON public.sessions
  FOR INSERT
  TO app_user
  WITH CHECK (true);

CREATE POLICY select_policy_app_user
  ON public.sessions
  FOR SELECT
  TO app_user
  USING (true);

CREATE POLICY delete_policy_app_user
  ON public.sessions
  FOR DELETE
  TO app_user
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- POSTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_app_user
  ON public.posts
  FOR INSERT
  TO app_user
  WITH CHECK (true);

CREATE POLICY select_policy_app_user
  ON public.posts
  FOR SELECT
  TO app_user
  USING (true);

CREATE POLICY update_policy_app_user
  ON public.posts
  FOR UPDATE
  TO app_user
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_app_user
  ON public.comments
  FOR INSERT
  TO app_user
  WITH CHECK (true);

CREATE POLICY select_policy_app_user
  ON public.comments
  FOR SELECT
  TO app_user
  USING (true);

CREATE POLICY update_policy_app_user
  ON public.comments
  FOR UPDATE
  TO app_user
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- REACTIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_app_user
  ON public.reactions
  FOR INSERT
  TO app_user
  WITH CHECK (true);

CREATE POLICY select_policy_app_user
  ON public.reactions
  FOR SELECT
  TO app_user
  USING (true);

CREATE POLICY update_policy_app_user
  ON public.reactions
  FOR UPDATE
  TO app_user
  USING (true)
  WITH CHECK (true);

CREATE POLICY delete_policy_app_user
  ON public.reactions
  FOR DELETE
  TO app_user
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- REPORTED_POSTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.reported_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_app_user
  ON public.reported_posts
  FOR INSERT
  TO app_user
  WITH CHECK (true);

CREATE POLICY select_policy_app_user
  ON public.reported_posts
  FOR SELECT
  TO app_user
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- REPORTED_COMMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.reported_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_app_user
  ON public.reported_comments
  FOR INSERT
  TO app_user
  WITH CHECK (true);

CREATE POLICY select_policy_app_user
  ON public.reported_comments
  FOR SELECT
  TO app_user
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- REPORTED_USERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.reported_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_app_user
  ON public.reported_users
  FOR INSERT
  TO app_user
  WITH CHECK (true);

CREATE POLICY select_policy_app_user
  ON public.reported_users
  FOR SELECT
  TO app_user
  USING (true);
