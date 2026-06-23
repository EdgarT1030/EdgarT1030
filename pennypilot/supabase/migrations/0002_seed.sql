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
