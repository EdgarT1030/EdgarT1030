-- ==============================================================
-- PennyPilot — ONE-SHOT DATABASE SETUP
-- Paste this entire file into the Supabase SQL Editor and Run.
-- It creates all tables, security rules, the prediction engine,
-- and demo seed data (4 stores, 5 items, sample penny reports).
-- ==============================================================

-- ########## PART 1: SCHEMA ##########
-- ============================================================
-- PennyPilot — initial schema
-- ============================================================

-- Enums
CREATE TYPE retailer_type AS ENUM ('home_depot', 'lowes', 'menards', 'other');
CREATE TYPE report_status AS ENUM ('pending', 'confirmed', 'expired', 'disputed');
CREATE TYPE vote_type AS ENUM ('confirm', 'dispute');

-- ────────────────────────────────────────────────────────────
-- profiles  (mirrors auth.users 1-to-1)
-- ────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username         text UNIQUE,
  reputation_score integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on first login
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ────────────────────────────────────────────────────────────
-- stores
-- ────────────────────────────────────────────────────────────
CREATE TABLE stores (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer     retailer_type NOT NULL,
  store_number text,
  name         text NOT NULL,
  address      text NOT NULL,
  city         text NOT NULL,
  state        char(2) NOT NULL,
  zip          text NOT NULL,
  lat          double precision NOT NULL,
  lng          double precision NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stores_retailer_idx ON stores(retailer);
CREATE INDEX stores_state_idx ON stores(state);

-- ────────────────────────────────────────────────────────────
-- items
-- ────────────────────────────────────────────────────────────
CREATE TABLE items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku          text,
  model_number text,
  name         text NOT NULL,
  category     text,
  image_url    text,
  created_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT items_has_identifier CHECK (sku IS NOT NULL OR model_number IS NOT NULL)
);

CREATE INDEX items_sku_idx ON items(sku);
CREATE INDEX items_model_number_idx ON items(model_number);

-- ────────────────────────────────────────────────────────────
-- penny_reports
-- ────────────────────────────────────────────────────────────
CREATE TABLE penny_reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  store_id       uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  reported_price numeric(6,2) NOT NULL DEFAULT 0.01,
  photo_url      text,
  status         report_status NOT NULL DEFAULT 'pending',
  reported_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at     timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX penny_reports_item_id_idx ON penny_reports(item_id);
CREATE INDEX penny_reports_store_id_idx ON penny_reports(store_id);
CREATE INDEX penny_reports_status_idx ON penny_reports(status);
CREATE INDEX penny_reports_expires_at_idx ON penny_reports(expires_at);

-- ────────────────────────────────────────────────────────────
-- report_votes
-- ────────────────────────────────────────────────────────────
CREATE TABLE report_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   uuid NOT NULL REFERENCES penny_reports(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote        vote_type NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id)
);

CREATE INDEX report_votes_report_id_idx ON report_votes(report_id);

-- ────────────────────────────────────────────────────────────
-- Vote trigger — update report status after each vote
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_report_status()
RETURNS trigger AS $$
DECLARE
  v_confirms integer;
  v_disputes integer;
  v_net      integer;
  v_threshold integer := 2; -- matches VOTE_THRESHOLD constant
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE vote = 'confirm'),
    COUNT(*) FILTER (WHERE vote = 'dispute')
  INTO v_confirms, v_disputes
  FROM report_votes
  WHERE report_id = COALESCE(NEW.report_id, OLD.report_id);

  v_net := v_confirms - v_disputes;

  UPDATE penny_reports
  SET status = CASE
    WHEN status = 'expired' THEN 'expired'   -- expired stays expired
    WHEN v_net >= v_threshold THEN 'confirmed'
    WHEN v_net <= -v_threshold THEN 'disputed'
    ELSE 'pending'
  END
  WHERE id = COALESCE(NEW.report_id, OLD.report_id)
    AND status != 'expired';

  -- Bump reputation for reporter when confirmed
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND v_net >= v_threshold THEN
    UPDATE profiles p
    SET reputation_score = reputation_score + 1
    FROM penny_reports r
    WHERE r.id = NEW.report_id
      AND r.reported_by = p.id
      AND r.status != 'confirmed'; -- only bump once
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON report_votes
  FOR EACH ROW EXECUTE FUNCTION update_report_status();

-- ────────────────────────────────────────────────────────────
-- Expiry — mark old reports expired (call this from a cron job
-- or Supabase pg_cron extension; also run client-side guard)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_old_reports()
RETURNS void AS $$
BEGIN
  UPDATE penny_reports
  SET status = 'expired'
  WHERE expires_at < now()
    AND status NOT IN ('expired', 'disputed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE penny_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_votes  ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_read_all"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- stores (anyone reads; authed users add new stores)
CREATE POLICY "stores_read_all"    ON stores FOR SELECT USING (true);
CREATE POLICY "stores_insert_auth" ON stores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- items
CREATE POLICY "items_read_all"    ON items FOR SELECT USING (true);
CREATE POLICY "items_insert_auth" ON items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "items_update_own"  ON items FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "items_delete_own"  ON items FOR DELETE USING (auth.uid() = created_by);

-- penny_reports
CREATE POLICY "reports_read_all"    ON penny_reports FOR SELECT USING (true);
CREATE POLICY "reports_insert_auth" ON penny_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reports_update_own"  ON penny_reports FOR UPDATE USING (auth.uid() = reported_by);
CREATE POLICY "reports_delete_own"  ON penny_reports FOR DELETE USING (auth.uid() = reported_by);

-- report_votes
CREATE POLICY "votes_read_all"    ON report_votes FOR SELECT USING (true);
CREATE POLICY "votes_insert_auth" ON report_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_delete_own"  ON report_votes FOR DELETE USING (auth.uid() = user_id);

-- ########## PART 2: SEED DATA ##########
-- ============================================================
-- PennyPilot — seed data (dev / demo only)
-- Run AFTER 0001_schema.sql
-- ============================================================

-- Stores
INSERT INTO stores (id, retailer, store_number, name, address, city, state, zip, lat, lng) VALUES
  ('11111111-0000-0000-0000-000000000001', 'home_depot', '0123', 'Home Depot - Austin North', '12901 N IH 35 Frontage Rd', 'Austin', 'TX', '78753', 30.3962, -97.6900),
  ('11111111-0000-0000-0000-000000000002', 'lowes',      '2345', "Lowe's - Austin North Lamar", '7028 N Lamar Blvd', 'Austin', 'TX', '78752', 30.3328, -97.7247),
  ('11111111-0000-0000-0000-000000000003', 'home_depot', '0456', 'Home Depot - Round Rock', '200 N IH 35', 'Round Rock', 'TX', '78681', 30.5243, -97.6803),
  ('11111111-0000-0000-0000-000000000004', 'menards',    '3219', 'Menards - Waco', '700 Lake Air Dr', 'Waco', 'TX', '76710', 31.5490, -97.1882);

-- Items
INSERT INTO items (id, sku, model_number, name, category) VALUES
  ('22222222-0000-0000-0000-000000000001', '1001541689', 'GE-LED60W-A19', 'GE 60W Equiv. Soft White A19 LED Bulb (4-Pack)', 'Lighting'),
  ('22222222-0000-0000-0000-000000000002', '1002577119', 'SP175-WH',      'Everbilt 1-3/4 in. Zinc-Plated Corner Brace (4-Pack)', 'Hardware'),
  ('22222222-0000-0000-0000-000000000003', '1003634782', 'CLX-12OZ-BLK',  'Rust-Oleum Chalked Ultra Matte Paint 12 oz Black', 'Paint'),
  ('22222222-0000-0000-0000-000000000004', '1001868273', 'WH600',         'Watts Water Technologies 3/4 in. Washing Machine Hose (2-Pack)', 'Plumbing'),
  ('22222222-0000-0000-0000-000000000005', '1004135692', 'DIABLO-6T-7IN', 'Diablo 7 in. x 6T Steel Demon Cermet Metal Cutting Blade', 'Tools');

-- Reports (no reported_by since these are seed rows without real user IDs)
INSERT INTO penny_reports (id, item_id, store_id, reported_price, status, expires_at) VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 0.01, 'confirmed', now() + interval '5 days'),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 0.01, 'confirmed', now() + interval '6 days'),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 0.01, 'pending',   now() + interval '7 days'),
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', 0.01, 'pending',   now() + interval '4 days'),
  ('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000004', 0.01, 'expired',   now() - interval '1 day');

-- ########## PART 3: PREDICTION LAYER ##########
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

-- ########## PART 4: PREDICTION SEED DATA ##########
-- ============================================================
-- PennyPilot — seed data for prediction layer (dev / demo only)
-- Run AFTER 0003_prediction_layer.sql
-- ============================================================

-- Update seed penny_reports with price_ending (they're already confirmed pennies)
UPDATE penny_reports SET price_ending = '01'
WHERE id IN (
  '33333333-0000-0000-0000-000000000001',
  '33333333-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000003',
  '33333333-0000-0000-0000-000000000004',
  '33333333-0000-0000-0000-000000000005'
);

-- Markdown observations — simulate a markdown progression for item 1 (LED bulbs)
-- Shows: .06 → .03 → .01 progression across two stores
INSERT INTO markdown_observations (item_id, store_id, observed_price, price_ending, observed_at) VALUES
  -- LED Bulbs: .06 stage 35 days ago (Store 1)
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 0.06, '06', now() - interval '35 days'),
  -- LED Bulbs: .03 stage 14 days ago (Store 1)
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 0.03, '03', now() - interval '14 days'),
  -- LED Bulbs: .01 penny confirmed (Store 1)
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 0.01, '01', now() - interval '2 days'),
  -- LED Bulbs: .01 also at Store 3 (nationwide signal)
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 0.01, '01', now() - interval '1 day'),

  -- Corner Brace (item 2): .06 → .03 progression, not yet penny
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 0.06, '06', now() - interval '28 days'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 0.03, '03', now() - interval '8 days'),

  -- Paint (item 3): at .03 for 5 days — moderate signal
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 0.03, '03', now() - interval '5 days'),

  -- Hose (item 4): at .06 recently
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', 0.06, '06', now() - interval '10 days'),

  -- Blade (item 5): only .06 early stage
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000004', 0.06, '06', now() - interval '5 days');

-- Cached predictions (pre-computed scores for demo)
-- Item 2 (Corner Brace): .03 for 8 days + 0 penny stores → score = 55 + 6 = 61
INSERT INTO predictions (item_id, score, predicted_window_days_low, predicted_window_days_high, reasons) VALUES
  ('22222222-0000-0000-0000-000000000002', 61, 7, 14,
   ARRAY['Final markdown stage (.03) — late clearance', 'Has sat at this price 8 days with stock remaining']),

  -- Item 3 (Paint): .03 for 5 days → score = 55 + 6 = 61
  ('22222222-0000-0000-0000-000000000003', 61, 7, 14,
   ARRAY['Final markdown stage (.03) — late clearance', 'Has sat at this price 5 days with stock remaining']),

  -- Item 4 (Hose): .06 for 10 days → score = 30
  ('22222222-0000-0000-0000-000000000004', 30, 21, 42,
   ARRAY['Mid markdown stage (.06) — worth watching']),

  -- Item 5 (Blade): .06 early → score = 30
  ('22222222-0000-0000-0000-000000000005', 30, 21, 42,
   ARRAY['Mid markdown stage (.06) — worth watching']);
