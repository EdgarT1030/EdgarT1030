-- ============================================================
-- PennyPilot — prediction layer
-- Run AFTER 0001_schema.sql
-- ============================================================

-- Add price_ending to penny_reports (default '01' for existing rows)
ALTER TABLE penny_reports
  ADD COLUMN IF NOT EXISTS price_ending text NOT NULL DEFAULT '01';

-- ────────────────────────────────────────────────────────────
-- markdown_observations
-- Every submission (penny OR candidate markdown) writes a row here.
-- This is the time-series that powers the prediction engine.
-- ────────────────────────────────────────────────────────────
CREATE TABLE markdown_observations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  store_id       uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  observed_price numeric(6,2) NOT NULL,
  price_ending   text NOT NULL,
  reported_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  observed_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mo_item_id_idx      ON markdown_observations(item_id);
CREATE INDEX mo_observed_at_idx  ON markdown_observations(observed_at DESC);
CREATE INDEX mo_price_ending_idx ON markdown_observations(price_ending);

-- ────────────────────────────────────────────────────────────
-- predictions — cached output of the scoring module
-- Upserted by server-side scoring; unique per item
-- ────────────────────────────────────────────────────────────
CREATE TABLE predictions (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id                    uuid NOT NULL UNIQUE REFERENCES items(id) ON DELETE CASCADE,
  score                      integer NOT NULL CHECK (score >= 0 AND score <= 100),
  predicted_window_days_low  integer,
  predicted_window_days_high integer,
  reasons                    text[] NOT NULL DEFAULT '{}',
  computed_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX predictions_score_idx ON predictions(score DESC);

-- ────────────────────────────────────────────────────────────
-- item_watchlist — users follow items they want to track
-- ────────────────────────────────────────────────────────────
CREATE TABLE item_watchlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id    uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

CREATE INDEX watchlist_user_id_idx ON item_watchlist(user_id);
CREATE INDEX watchlist_item_id_idx ON item_watchlist(item_id);

-- ────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────
ALTER TABLE markdown_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_watchlist        ENABLE ROW LEVEL SECURITY;

-- markdown_observations: public read, authed write
CREATE POLICY "mo_read_all"    ON markdown_observations FOR SELECT USING (true);
CREATE POLICY "mo_insert_auth" ON markdown_observations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- predictions: public read; server upserts (anon key sufficient since RLS allows all)
CREATE POLICY "pred_read_all"    ON predictions FOR SELECT USING (true);
CREATE POLICY "pred_insert_auth" ON predictions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "pred_update_auth" ON predictions FOR UPDATE USING (true);

-- watchlist: each user owns their own rows
CREATE POLICY "watchlist_select_own" ON item_watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "watchlist_insert_own" ON item_watchlist FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "watchlist_delete_own" ON item_watchlist FOR DELETE  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Supabase Realtime — enable live feed for penny_reports
-- (Alternatively: Supabase dashboard → Database → Replication)
-- ────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE penny_reports;
