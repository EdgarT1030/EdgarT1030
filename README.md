# Hi, I'm Edgar 👋

**Builder and solo founder.** I ship end-to-end software across very different
domains — real-time computer vision, applied cryptography, multi-tenant SaaS, and
data automation — and I learn fast by taking projects all the way from a blank
folder to something that actually runs.

I care about the parts that are easy to get wrong: tenant isolation, key handling,
tamper-evidence, and clean readable code over clever code.

---

## 🚀 Featured projects

> 🔒 = private repository. I'm happy to give a live code walkthrough on request.

### 🛰️ BirdWatch — Real-time AI surveillance system 🔒
A computer-vision security platform that watches a live video feed, identifies
threats, and alerts you the moment something matters.
- **YOLOv8 + OpenCV** detection pipeline with confidence thresholding and threat
  classification (person → *intruder*, vehicles, unattended bags, animals).
- **Live Flask dashboard** streaming annotated video (MJPEG) with on-screen
  detection overlays, plus screen-capture ingest from a **DJI Mini 2** drone feed.
- **Debounced email alerting** (SMTP) so a standing threat fires once, not 200 times.
- **HMAC-SHA256 command authentication** with token expiry and a heartbeat
  ("pulse") so the drone only acts on signed, fresh commands.

`Python` · `YOLOv8 / Ultralytics` · `OpenCV` · `Flask` · `HMAC-SHA256`

### 🔐 Afflant — Tamper-evident event ledger 🔒
A forensic logging system that makes data dishonesty impossible to hide: if anyone
edits a recorded event after the fact, an independent audit catches it instantly
and points at the exact record.
- **Ed25519 digital signatures** on every record (PyNaCl / libsodium) — edit one
  byte and the signature breaks.
- **SHA-256 hash chain** linking each record to the one before it, so deleting or
  reordering history breaks the chain at the precise tampered spot.
- **Independent verifier** that needs nothing but the log file and reports *exactly*
  which record failed and how (bad signature vs. broken chain).
- Zero homemade cryptography — trusted libraries only.

`Python` · `Ed25519 / PyNaCl` · `SHA-256 hash chains` · `digital forensics`

### 🏢 agency-hub — Multi-tenant SaaS platform 🔒
A full-stack control hub designed so one customer can *never* see another's data —
enforced at the database, not just the application.
- **Next.js (App Router) + tRPC + TypeScript** end to end, type-safe from DB to UI.
- **Postgres Row-Level Security** with two scoped roles and a per-request tenant
  context — isolation lives in the database, the hardest place to bypass.
- **Composite foreign keys** `(site_id, org_id)` so a record's tenant can never drift.
- An **automated isolation test** treated as the one check that must never break.

`TypeScript` · `Next.js` · `tRPC` · `Postgres + RLS` · `Drizzle ORM` · `Neon` · `Vercel`

### 📈 local-lead-engine — Zero-dependency data & automation toolkit 🔒
A Python pipeline that turns open map data into a ranked, actionable prospect list —
running entirely on the standard library, no API keys, no paid services.
- **Data ingestion** from OpenStreetMap (Overpass API) + Photon geocoding.
- **Scoring engine** that ranks prospects from real signals (missing website,
  DIY/stale builders, no HTTPS, not mobile-friendly).
- **Automated reporting** — generates per-prospect audits and ready-to-send proposals.
- **CRM pipeline** with status tracking, CSV export, and revenue projection.

`Python (stdlib only)` · `REST/Overpass APIs` · `data scoring` · `CLI tooling`

---

## 🧰 Tech I work with

| Area | Tools |
|---|---|
| **Languages** | Python, TypeScript, SQL, HTML/CSS |
| **AI / Computer Vision** | YOLOv8 (Ultralytics), OpenCV |
| **Web / Full-stack** | Next.js, tRPC, Tailwind, Flask, Drizzle ORM |
| **Data & Infra** | Postgres (Row-Level Security), Neon, Vercel |
| **Security & Crypto** | Ed25519 (PyNaCl), HMAC-SHA256, hash chains, DB-level isolation |

---

## 💡 How I work
I build in small, frequent commits, prefer simple code that the next person can
read, and like understanding the *why* behind a tool before reaching for it —
whether that's a digital signature scheme or a database security model.

📫 Reach me at **edgarito2001@yahoo.com**
