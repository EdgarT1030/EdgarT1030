# PennyPilot

A community-verified ledger for "penny items" — products at major retailers (Home Depot, Lowe's, Menards, etc.) whose in-store price has dropped to $0.01 during inventory purges.

> **Disclaimer:** Penny pricing is an unofficial inventory-purge artifact, not a published offer. Stores are not obligated to honor it. This app only stores user-submitted reports — it does not scrape or make automated requests to any retailer. Please behave respectfully in stores.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — copper/amber brand palette
- **Supabase** — Postgres, Auth (magic link), Storage (photos), RLS
- **Zod** — input validation
- **Vercel** — deploy target (free tier compatible)

## Local setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and note:
- Project URL
- Anon public key
- Service role key (Settings → API)

### 2. Run migrations

In the Supabase dashboard → SQL Editor, run these files **in order**:

1. `supabase/migrations/0001_schema.sql` — tables, enums, RLS, triggers
2. `supabase/migrations/0002_seed.sql` — demo stores, items, and reports

### 3. Create Storage bucket

In Supabase → Storage, create a bucket named **`report-photos`** with:
- Public access: **enabled** (for public image URLs)
- File size limit: 5 MB
- Allowed MIME types: `image/*`

### 4. Set environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> Never commit `.env.local`. It is gitignored.

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional: auto-expire stale reports

Penny finds go stale in 7 days. To auto-expire them, enable the **pg_cron** extension in Supabase and run:

```sql
select cron.schedule('expire-penny-reports', '0 * * * *', 'select expire_old_reports()');
```

This calls the `expire_old_reports()` function every hour.

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add the three environment variables in Project Settings → Environment Variables
4. Deploy

## Project structure

```
app/                  # Next.js App Router pages
  auth/               # Magic link login + callback + sign out
  report/[id]/        # Report detail page
  search/             # SKU checker
  submit/             # Submit a find
  profile/            # User profile
components/
  ui/                 # Badge, Skeleton, EmptyState
  BottomNav.tsx
  ReportCard.tsx
  VoteButtons.tsx
  SkuSearchBox.tsx
  PhotoUpload.tsx
lib/
  supabase/           # Browser + server clients, types
  constants.ts        # VOTE_THRESHOLD, EXPIRY_DAYS, enums
  haversine.ts        # Distance calculation (no Maps API)
  validators.ts       # Zod schemas
supabase/
  migrations/         # SQL migrations (run these manually)
```

## Legal

PennyPilot does not scrape, crawl, or make automated requests to Home Depot, Lowe's, Menards, or any other retailer. All data is user-submitted. We store only your email address and chosen username. Use responsibly.
