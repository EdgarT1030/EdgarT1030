# Hi, I'm Edgar 👋

**Builder and solo founder.** I ship end-to-end software across very different
domains — real-time computer vision, applied cryptography, multi-tenant SaaS, and
data automation — and I learn fast by taking projects all the way from a blank
folder to something that actually runs.

I care about the parts that are easy to get wrong: tenant isolation, key handling,
tamper-evidence, and clean readable code over clever code.

---

## 🚀 Featured projects

> 🔒 = private repository (commercial work). Happy to give a live code walkthrough on request.

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

### 🏢 Multi-tenant SaaS platform 🔒
A type-safe full-stack platform where one customer can *never* see another's data —
enforced at the database, not just the application.
- **Next.js (App Router) + tRPC + TypeScript**, type-safe end to end from DB to UI.
- **Postgres Row-Level Security** with scoped roles and per-request tenant context —
  isolation lives in the database, the hardest place to bypass.
- **Composite foreign keys** so a record's tenant can never drift.
- An **automated isolation test** treated as the one check that must never break.

`TypeScript` · `Next.js` · `tRPC` · `Postgres + RLS` · `Drizzle ORM`

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
| **Web / Full-stack** | Next.js, tRPC, Tailwind, Flask, Drizzle ORM |
| **Data & Infra** | Postgres (Row-Level Security), Neon, Vercel |
| **Security & Crypto** | Ed25519 (PyNaCl), HMAC-SHA256, hash chains, DB-level isolation |

---

## 📊 GitHub

![Edgar's GitHub stats](https://github-readme-stats.vercel.app/api?username=EdgarT1030&show_icons=true&hide_border=true&include_all_commits=true)

---

## 💡 How I work
I build in small, frequent commits, prefer simple code that the next person can
read, and like understanding the *why* behind a tool before reaching for it —
whether that's a digital signature scheme or a database security model.

📫 Reach me at **edgarito2001@yahoo.com**
