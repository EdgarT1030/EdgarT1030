# 🪙 PennyPilot

**Find the penny. Predict the next one.**

A community-driven tool for tracking "penny items" at major retailers like Home Depot and Lowe's — and a prediction engine that forecasts *which items are about to drop to $0.01* before they do.

> ⚠️ **Disclaimer:** Penny pricing is an unofficial inventory artifact, **not an offer**. Retailers are under no obligation to honor it, and policies vary by store and manager. Be respectful to staff. PennyPilot stores only user-submitted reports and never scrapes or automates requests against retailer systems.

---

## What's a penny item?

When a retailer purges a product from inventory, its in-store price can drop to **$0.01**. This isn't published anywhere — it's an internal clearance signal that only shows when an item is scanned at a store price-checker. PennyPilot doesn't scrape. It's a **verified community ledger + prediction engine**.

## What PennyPilot does

- 🔎 **SKU Checker** — paste a SKU or model number and instantly see if it's a known penny item, plus its **Penny Probability Score**. Built for one-handed use in the store aisle.
- 📍 **Near Me feed** — browse confirmed and pending finds, sorted by distance and recency, updating **live via Supabase Realtime**.
- 📈 **Prediction engine** — tracks markdown stages (.06 → .03 → .01) and predicts which items are *about* to penny: "78% likely within 9–14 days." This is the part competitors don't have.
- 📝 **Submit a find or candidate** — report a penny OR an item still marking down (.03 / .06), with store, SKU, price-ending, and an optional scanner photo. Every submission feeds the predictor.
- ✅ **Crowd verification** — confirm/dispute votes and one-tap "Still here / Gone" keep data honest and fresh.
- 🔖 **Watchlist** — bookmark high-scoring items and get notified when they're about to drop.
- 👤 **Reputation** — reliable reporters build a track record.

---

## How the data works

PennyPilot does **not scrape** retailers (penny prices aren't published online and scraping violates their terms). Instead it builds its own dataset from three layers:

1. **Predictive** — markdown candidate submissions (.03 / .06) write `markdown_observations` rows
2. **Reported** — confirmed $0.01 finds create `penny_reports` + another observation
3. **Verified** — community votes and "still here / gone" checks keep data fresh

The observation time-series powers the **Penny Probability Score** (see `/lib/scoring/pennyScore.ts`).

---

## The Penny Probability Score

Implemented as an isolated, swappable module (`/lib/scoring/`) with 21 unit tests. Formula inputs:

| Signal | Weight |
|---|---|
| Price ending (.03 final markdown) | +55 base |
| Price ending (.06 mid markdown)   | +30 base |
| Penny reports at 5+ stores        | +30      |
| Penny reports at 3–4 stores       | +20      |
| Dwell time at .03 for 10+ days    | +10      |
| Seasonal match for category       | +5       |

Non-confirmed items are capped at 99 (100 reserved for actual penny). Predicted window: 7–14 days from .03, 21–42 days from .06, shrinks when nationwide stores confirm it.

The module is designed to be replaced with a survival analysis or logistic regression model once enough `markdown_observations` rows exist.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS — copper/amber brand palette |
| Backend / DB / Auth | Supabase (Postgres, magic-link auth, Storage, RLS, Realtime) |
| Hosting | Vercel |
| Validation | Zod |
| Tests | Vitest (21 scoring unit tests) |

All on free tiers. No paid third-party APIs. Distance sorting uses haversine formula (no Google Maps).

---

## Local setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run migrations (in order)

In the Supabase dashboard → SQL Editor:

1. `supabase/migrations/0001_schema.sql` — core tables, enums, RLS, triggers
2. `supabase/migrations/0002_seed.sql` — demo stores, items, reports
3. `supabase/migrations/0003_prediction_layer.sql` — markdown_observations, predictions, watchlist
4. `supabase/migrations/0004_seed_predictions.sql` — demo observation time-series + cached scores

### 3. Create Storage bucket

In Supabase → Storage, create a bucket named **`report-photos`**:
- Public access: **enabled**
- File size limit: 5 MB
- Allowed MIME types: `image/*`

### 4. Enable Realtime (optional but recommended)

In Supabase → Database → Replication → enable the `penny_reports` table.
(The migration runs `ALTER PUBLICATION supabase_realtime ADD TABLE penny_reports` automatically.)

### 5. Set environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 6. Install and run

```bash
npm install
npm run dev       # dev server at localhost:3000
npm run test      # run the 21 scoring unit tests
npm run build     # production build check
```

---

## Auto-expire stale reports

Enable pg_cron in Supabase and run:

```sql
select cron.schedule('expire-penny-reports', '0 * * * *', 'select expire_old_reports()');
```

---

## Project structure

```
app/                    # Next.js App Router pages
  auth/                 # Magic link login + callback + sign out
  report/[id]/          # Report detail + markdown history timeline
  search/               # SKU Checker + Penny Score + retailer link-outs
  submit/               # Submit a find or markdown candidate
  watchlist/            # Predictions feed + personal watchlist
  profile/              # User profile + reputation + submissions
components/
  ui/                   # Badge, Skeleton, EmptyState
  BottomNav.tsx
  ReportCard.tsx        # Shows score badge when applicable
  VoteButtons.tsx
  SkuSearchBox.tsx
  PhotoUpload.tsx
  PennyScoreBadge.tsx   # Score % + predicted window + reason list
lib/
  scoring/
    config.ts           # Tunable weights (do not hardcode)
    types.ts            # ScoreInputs, ScoreOutput
    pennyScore.ts       # v1 formula — pure functions, swappable
    __tests__/          # 21 Vitest unit tests
  supabase/             # Browser + server clients, typed Database
  constants.ts
  haversine.ts
  validators.ts
supabase/
  migrations/           # 4 migration files — run in order
```

---

## Legal

PennyPilot does not scrape, crawl, or make automated requests to Home Depot, Lowe's, Menards, or any other retailer. All data is user-submitted. We store only your email address and chosen username. Use responsibly.
