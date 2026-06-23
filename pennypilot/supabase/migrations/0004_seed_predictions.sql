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
