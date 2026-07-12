# 🍉 Watermelon 500

A mobile-first web app that helps you decide if a watermelon is ripe **before**
you cut it open — using nothing but your phone's camera and microphone.

No app store, no install, no backend: it's a single static page that runs
entirely client-side and can be installed as a PWA straight from the browser.

## How it works

Two independent checks, each producing a 0–100 ripeness score, combined into
one verdict:

### 📸 Photo check
Take (or upload) a photo of the melon. The app draws it to a `<canvas>`,
reads the raw pixel data, and converts every sampled pixel to HSL to look for
two classic ripeness signals:

- **Field spot** — the creamy yellow/orange patch where the melon rested on
  the ground. More of it (relative to frame) generally means riper.
- **Gloss** — very bright, low-saturation pixels (shine/highlight). A glossy
  rind usually means the melon is still unripe; ripe rinds look duller/matte.

### 🎤 Tap-sound check
Tap the rind with a knuckle while the app listens for ~4 seconds. It uses the
Web Audio API (`AnalyserNode`) to read live frequency + time-domain data,
detects the loud "tap" frames against the ambient noise floor, and looks at:

- **Dominant frequency** of the tap — a deep, low-pitched thump tends to mean
  ripe; a high-pitched "tink" tends to mean unripe.
- **Spectral brightness** — how much energy sits above ~1 kHz, another proxy
  for a "tight/unripe" vs. "hollow/ripe" tone.

### Combined verdict
The two scores (whichever are available) are averaged into a final verdict:
**Good to eat**, **Borderline**, or **Not ready / overripe**, along with a
breakdown of what drove the score.

This is a **heuristic assistant, not a lab instrument** — rind colour and
patterning vary a lot by variety. It's meant to complement, not replace, the
classic checks (dried curly tendril at the stem, matte skin, heavy for its
size).

## Running it

No build step, no dependencies. Just serve the folder statically — camera and
microphone access require `https://` or `localhost`, so opening `index.html`
directly via `file://` won't get permission prompts on most browsers.

```bash
cd watermelon-500
python3 -m http.server 8080
# then open http://localhost:8080 on your phone (same network) or via a tunnel
```

Or deploy the folder as-is to GitHub Pages, Vercel, Netlify, or any static
host — it's just `index.html`, `styles.css`, `app.js`, a manifest, and a
service worker for offline caching.

## Privacy

All processing happens on-device in the browser. No photo, audio, or score
is ever uploaded anywhere.

## Stack

`HTML` · `CSS` · `Vanilla JavaScript` · `Canvas API` · `Web Audio API` · `PWA`
(Web App Manifest + Service Worker)
