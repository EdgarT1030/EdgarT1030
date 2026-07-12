# Hi, I'm Edgar 👋

**Builder and solo founder.** I ship end-to-end software across very different
domains — real-time computer vision, applied cryptography, multi-tenant SaaS,
data automation, and now a prediction-driven community app. I learn fast by
taking projects all the way from a blank folder to something that actually runs.

I care about the parts that are easy to get wrong: data model correctness, tenant
isolation, key handling, tamper-evidence, and clean readable code over clever code.

---

## 🚀 Featured projects

> 🔒 = private repository (commercial work). Happy to give a live code walkthrough on request.

### 🏢 Multi-tenant SaaS platform 🔒
A type-safe full-stack platform where one customer can *never* see another's data —
enforced at the database, not just the application.
- **Next.js (App Router) + tRPC + TypeScript**, type-safe end to end from DB to UI.
- **Postgres Row-Level Security** with scoped roles and per-request tenant context —
  isolation lives in the database, the hardest place to bypass.
- **Composite foreign keys** so a record's tenant can never drift.
- An **automated isolation test** treated as the one check that must never break.

`TypeScript` · `Next.js` · `tRPC` · `Postgres + RLS` · `Drizzle ORM`

---

### 🍉 [Watermelon 500](https://github.com/EdgarT1030/EdgarT1030/tree/claude/watermelon-quality-detector-f4tvdv/watermelon-500) — Snap-or-tap ripeness checker
A zero-install, mobile-first web app that tells you if a watermelon is ripe
using only your phone's camera and microphone — no backend, no upload.

- **Photo check** — reads raw canvas pixel data and converts to HSL to spot
  the creamy "field spot" (ripeness signal) and rind glossiness (unripe signal).
- **Tap-sound check** — uses the **Web Audio API** (`AnalyserNode`) to listen
  to a knuckle-tap in real time, doing onset detection against the noise floor
  and classifying the dominant tap frequency and spectral brightness (deep
  hollow thump = ripe, high-pitched tink = unripe).
- **Combined verdict** — averages both scores into a plain "good to eat /
  borderline / not ready" result with a reasoning breakdown.
- Installable **PWA** (manifest + service worker) — everything runs client-side,
  nothing ever leaves the device.

`HTML` · `CSS` · `Vanilla JavaScript` · `Canvas API` · `Web Audio API` · `PWA`

---

### 🪙 [PennyPilot](https://github.com/EdgarT1030/EdgarT1030/tree/claude/pennypilot-scaffold-q1aowm/pennypilot) — Community penny-item finder + prediction engine
A mobile-first web app that lets deal hunters find and verify "penny items" —
products whose in-store price has dropped to $0.01 during retailer inventory purges.
The differentiator: it doesn't just log finds like competitors do. It builds a
proprietary markdown time-series and uses it to **predict which items are about to
drop to $0.01 before they do**.

- **Prediction engine** tracks clearance markdown stages (.06 → .03 → .01) and
  outputs a **Penny Probability Score** (0–100) with a predicted time window (e.g.
  "78% likely within 9–14 days"). Formula implemented as a pure, isolated, swappable
  module (`/lib/scoring`) with **21 unit tests** — designed to be replaced with a
  survival analysis model once real training data exists.
- **Community ledger** — users report finds (store, SKU, price-ending, optional
  scanner photo); others confirm/dispute; reports expire after 7 days. Trust is
  enforced at the database layer with Postgres **Row Level Security**.
- **Live feed** — new finds appear in real time via **Supabase Realtime** (Postgres
  CDC → WebSocket → optimistic UI update), no manual refresh needed.
- **SKU Checker** — a one-tap search for someone standing in the aisle: paste a SKU,
  get back all known reports + the Penny Score + predicted window + link-outs to
  retailer product pages.
- **Watchlist / Predictions** — browse all high-scoring candidates sorted by probability;
  bookmark items to follow.
- Haversine distance sorting (no Google Maps billing), Supabase Storage for photos,
  Zod for all input validation, magic-link auth.

`TypeScript` · `Next.js 14 (App Router)` · `Supabase (Postgres + RLS + Realtime + Storage)` · `Tailwind CSS` · `Zod` · `Vitest`

---

### 🛰️ [BirdWatch](https://github.com/EdgarT1030/BirdWatch) — Real-time AI surveillance
A computer-vision security system that watches a live feed, identifies threats, and
alerts you the instant something matters.
- **YOLOv8 + OpenCV** detection pipeline with confidence thresholding and threat
  classification (person → *intruder*, vehicles, unattended bags, animals).
- **Live Flask dashboard** streaming annotated video (MJPEG), plus screen-capture
  ingest from a **DJI Mini 2** drone feed.
- **Debounced email alerting** (SMTP) so a standing threat fires once, not 200 times.
- **HMAC-SHA256 command authentication** with token expiry and a heartbeat so the
  system only acts on signed, fresh commands.

`Python` · `YOLOv8 / Ultralytics` · `OpenCV` · `Flask` · `HMAC-SHA256`

---

### 🔐 Tamper-evident event ledger 🔒
A forensic logging system: once an event is recorded, any later edit is *provably*
detectable.
- **Ed25519 digital signatures** on every record (PyNaCl / libsodium) — edit one
  byte and the signature breaks.
- **SHA-256 hash chain** linking each record to the one before it, so deleting or
  reordering history breaks the chain at the precise tampered spot.
- **Independent verifier** that needs nothing but the log file and reports *exactly*
  which record failed and how.
- Zero homemade cryptography — trusted libraries only.

`Python` · `Ed25519 / PyNaCl` · `SHA-256 hash chains` · `applied cryptography`

---

### 📊 Data aggregation & scoring pipeline 🔒
A zero-dependency Python pipeline that ingests data from public APIs, ranks records
with a configurable scoring engine, and generates reports — running entirely on the
standard library.
- **External REST API integration** with geospatial data sources.
- **Configurable scoring engine** that ranks records from multiple weighted signals.
- **Automated report generation** and CSV export.
- **Stateful pipeline** with status tracking — and no third-party dependencies.

`Python (stdlib only)` · `REST APIs` · `scoring algorithms` · `CLI tooling`

---

## 🧰 Tech I work with

| Area | Tools |
|---|---|
| **Languages** | Python, TypeScript, SQL, HTML/CSS |
| **AI / Computer Vision** | YOLOv8 (Ultralytics), OpenCV |
| **Web / Full-stack** | Next.js (App Router), tRPC, Tailwind, Flask, Drizzle ORM |
| **Data & Infra** | Postgres (Row-Level Security), Supabase, Neon, Vercel |
| **Real-time** | Supabase Realtime (Postgres CDC → WebSocket) |
| **Security & Crypto** | Ed25519 (PyNaCl), HMAC-SHA256, hash chains, DB-level isolation |
| **Testing** | Vitest, pytest |

---

## 📊 GitHub

![Edgar's GitHub stats](https://github-readme-stats.vercel.app/api?username=EdgarT1030&show_icons=true&hide_border=true&include_all_commits=true)

---

## 💡 How I work
I build in small, frequent commits, prefer simple code that the next person can
read, and like understanding the *why* behind a tool before reaching for it —
whether that's a digital signature scheme, a database security model, or a
statistical prediction formula.

📫 Reach me at **edgarito2001@yahoo.com**
