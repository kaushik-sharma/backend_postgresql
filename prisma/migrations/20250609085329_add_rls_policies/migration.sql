-- ─────────────────────────────────────────────────────────────────────────────
-- GRANT TABLE-LEVEL RIGHTS
-- ─────────────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO app_user;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public
  TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

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

CREATE POLICY delete_policy_app_user
  ON public.users
  FOR DELETE
  TO app_user
  USING (true);

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
-- REPORTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_app_user
  ON public.reports
  FOR INSERT
  TO app_user
  WITH CHECK (true);

CREATE POLICY select_policy_app_user
  ON public.reports
  FOR SELECT
  TO app_user
  USING (true);

CREATE POLICY update_policy_app_user
  ON public.reports
  FOR UPDATE
  TO app_user
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONNECTIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_policy_app_user
  ON public.connections
  FOR INSERT
  TO app_user
  WITH CHECK (true);

CREATE POLICY select_policy_app_user
  ON public.connections
  FOR SELECT
  TO app_user
  USING (true);

CREATE POLICY delete_policy_app_user
  ON public.connections
  FOR DELETE
  TO app_user
  USING (true);
