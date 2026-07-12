"use strict";

const state = {
  photo: null, // { score, notes }
  audio: null, // { score, notes }
};

/* ---------- shared helpers ---------- */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = 60 * (((g - b) / d) % 6); break;
      case g: h = 60 * ((b - r) / d + 2); break;
      case b: h = 60 * ((r - g) / d + 4); break;
    }
  }
  if (h < 0) h += 360;
  return [h, s, l];
}

/* ---------- photo analysis ---------- */

const photoInput = document.getElementById("photo-input");
const photoCanvas = document.getElementById("photo-canvas");
const photoPreview = document.getElementById("photo-preview");
const photoResultEl = document.getElementById("photo-result");

photoInput.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const dataUrl = await fileToDataUrl(file);
  photoPreview.src = dataUrl;
  photoPreview.hidden = false;

  const img = await loadImage(dataUrl);
  const analysis = analyzeImage(img);
  state.photo = analysis;
  renderPhotoResult(analysis);
  updateVerdict();
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function analyzeImage(img) {
  const maxW = 480;
  const scale = Math.min(1, maxW / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const ctx = photoCanvas.getContext("2d");
  photoCanvas.width = w;
  photoCanvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  const total = w * h;
  let fieldSpot = 0, gloss = 0, green = 0;

  // sample every 3rd pixel for performance
  for (let i = 0; i < data.length; i += 4 * 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const [hue, sat, light] = rgbToHsl(r, g, b);

    if (light > 0.88 && sat < 0.35) {
      gloss++;
    } else if (hue >= 30 && hue <= 70 && sat > 0.25 && light > 0.35 && light < 0.85) {
      fieldSpot++;
    } else if (hue > 70 && hue < 170) {
      green++;
    }
  }

  const sampled = Math.ceil(data.length / (4 * 3));
  const fieldSpotPct = fieldSpot / sampled;
  const glossPct = gloss / sampled;
  const greenPct = green / sampled;

  let score = 50 + fieldSpotPct * 180 - glossPct * 120;
  score = clamp(score, 5, 95);

  const notes = [];
  if (fieldSpotPct > 0.03) {
    notes.push(`Creamy yellow field-spot detected (${(fieldSpotPct * 100).toFixed(1)}% of frame) — a good ripeness sign.`);
  } else {
    notes.push("No clear creamy field-spot detected — try including the patch that rested on the ground.");
  }
  if (glossPct > 0.05) {
    notes.push(`Skin looks glossy in ${(glossPct * 100).toFixed(1)}% of the frame — shine usually means it's still unripe.`);
  } else {
    notes.push("Skin looks matte rather than shiny — a good ripeness sign.");
  }
  if (greenPct < 0.15) {
    notes.push("Not much rind visible in frame — for best results, fill the photo with the melon.");
  }

  return { score, notes, fieldSpotPct, glossPct };
}

function renderPhotoResult(analysis) {
  photoResultEl.hidden = false;
  photoResultEl.innerHTML =
    `<div class="score-line">Visual ripeness score: ${Math.round(analysis.score)}/100</div>` +
    `<ul>${analysis.notes.map((n) => `<li>${n}</li>`).join("")}</ul>`;
}

/* ---------- tap-sound analysis ---------- */

const micBtn = document.getElementById("mic-btn");
const meter = document.getElementById("meter");
const meterFill = document.getElementById("meter-fill");
const micStatus = document.getElementById("mic-status");
const audioResultEl = document.getElementById("audio-result");

const TEST_DURATION_MS = 4000;

micBtn.addEventListener("click", runTapTest);

async function runTapTest() {
  micBtn.disabled = true;
  meter.hidden = false;
  micStatus.hidden = false;
  audioResultEl.hidden = true;
  micStatus.textContent = "Requesting microphone…";

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    micStatus.textContent = "Microphone permission denied or unavailable.";
    micBtn.disabled = false;
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const sampleRate = audioCtx.sampleRate;
  const binHz = sampleRate / analyser.fftSize;
  const freqData = new Float32Array(analyser.frequencyBinCount);
  const timeData = new Float32Array(analyser.fftSize);

  const minBin = Math.max(1, Math.floor(40 / binHz));
  const maxBin = Math.min(analyser.frequencyBinCount - 1, Math.ceil(4000 / binHz));
  const brightBin = Math.floor(1000 / binHz);

  const frames = [];
  const startTime = performance.now();

  function tick() {
    analyser.getFloatTimeDomainData(timeData);
    let sumSq = 0;
    for (let i = 0; i < timeData.length; i++) sumSq += timeData[i] * timeData[i];
    const rms = Math.sqrt(sumSq / timeData.length);

    analyser.getFloatFrequencyData(freqData);
    let peakBin = minBin, peakVal = -Infinity;
    let total = 0, bright = 0;
    for (let b = minBin; b <= maxBin; b++) {
      const mag = Math.pow(10, freqData[b] / 20);
      total += mag;
      if (b >= brightBin) bright += mag;
      if (freqData[b] > peakVal) {
        peakVal = freqData[b];
        peakBin = b;
      }
    }
    frames.push({
      rms,
      peakFreq: peakBin * binHz,
      brightness: total > 0 ? bright / total : 0,
    });

    meterFill.style.width = `${clamp(rms * 400, 0, 100)}%`;

    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, TEST_DURATION_MS - elapsed);
    micStatus.textContent = `Tap the melon now… ${(remaining / 1000).toFixed(1)}s`;

    if (elapsed < TEST_DURATION_MS) {
      requestAnimationFrame(tick);
    } else {
      finish();
    }
  }

  function finish() {
    stream.getTracks().forEach((t) => t.stop());
    audioCtx.close();
    meter.hidden = true;
    micBtn.disabled = false;
    micBtn.textContent = "Test again";

    const result = classifyTapFrames(frames);
    state.audio = result;
    renderAudioResult(result);
    updateVerdict();
  }

  requestAnimationFrame(tick);
}

function classifyTapFrames(frames) {
  if (!frames.length) {
    return { score: null, notes: ["No audio captured — try again."] };
  }

  const maxRms = Math.max(...frames.map((f) => f.rms));
  if (maxRms < 0.015) {
    return {
      score: null,
      notes: ["Tap wasn't loud enough to analyse — hold the phone closer and tap firmly with a knuckle."],
    };
  }

  const threshold = maxRms * 0.5;
  const tapFrames = frames.filter((f) => f.rms >= threshold);
  const weightSum = tapFrames.reduce((s, f) => s + f.rms, 0);
  const avgFreq = tapFrames.reduce((s, f) => s + f.peakFreq * f.rms, 0) / weightSum;
  const avgBrightness = tapFrames.reduce((s, f) => s + f.brightness * f.rms, 0) / weightSum;

  let score, tone;
  if (avgFreq < 180 && avgBrightness < 0.3) {
    score = 82; tone = "Deep, hollow thump — a classic ripe sound.";
  } else if (avgFreq < 260 && avgBrightness < 0.45) {
    score = 65; tone = "Medium, slightly hollow tone.";
  } else if (avgFreq < 350) {
    score = 45; tone = "Fairly tight or dull tone — could be a bit underripe.";
  } else {
    score = 25; tone = "High-pitched, tinny tone — usually means unripe.";
  }

  const notes = [
    `Dominant tap tone: ~${Math.round(avgFreq)} Hz.`,
    tone,
  ];

  return { score, notes };
}

function renderAudioResult(result) {
  audioResultEl.hidden = false;
  if (result.score === null) {
    audioResultEl.innerHTML = `<ul>${result.notes.map((n) => `<li>${n}</li>`).join("")}</ul>`;
    return;
  }
  audioResultEl.innerHTML =
    `<div class="score-line">Tap-sound ripeness score: ${Math.round(result.score)}/100</div>` +
    `<ul>${result.notes.map((n) => `<li>${n}</li>`).join("")}</ul>`;
}

/* ---------- combined verdict ---------- */

const verdictCard = document.getElementById("verdict-card");
const verdictBadge = document.getElementById("verdict-badge");
const verdictBreakdown = document.getElementById("verdict-breakdown");

function updateVerdict() {
  const scores = [];
  const breakdown = [];

  if (state.photo && typeof state.photo.score === "number") {
    scores.push(state.photo.score);
    breakdown.push(`📸 Photo: ${Math.round(state.photo.score)}/100`);
  }
  if (state.audio && typeof state.audio.score === "number") {
    scores.push(state.audio.score);
    breakdown.push(`🎤 Tap sound: ${Math.round(state.audio.score)}/100`);
  }

  if (!scores.length) {
    verdictCard.hidden = true;
    return;
  }

  const combined = scores.reduce((a, b) => a + b, 0) / scores.length;
  verdictCard.hidden = false;

  let label, cls;
  if (combined >= 65) {
    label = "✅ Looks good to eat!";
    cls = "good";
  } else if (combined >= 40) {
    label = "🤔 Borderline — worth a second check";
    cls = "borderline";
  } else {
    label = "❌ Probably not ready (or overripe)";
    cls = "bad";
  }

  verdictBadge.className = `verdict-badge ${cls}`;
  verdictBadge.textContent = `${label} (${Math.round(combined)}/100)`;

  breakdown.push(scores.length < 2
    ? "Add the other check for a more confident result."
    : "Based on both checks combined.");

  verdictBreakdown.innerHTML = breakdown.map((b) => `<li>${b}</li>`).join("");
}

/* ---------- service worker (optional offline support) ---------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
