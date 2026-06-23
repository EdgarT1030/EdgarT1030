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
