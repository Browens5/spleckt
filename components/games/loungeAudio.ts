/**
 * Tiny Web Audio lounge band: a walking-bass jazz loop plus table SFX.
 * No sample files — oscillators and noise keep memory low.
 */

export type SfxName = "drop" | "card" | "hit" | "miss" | "win" | "click" | "place";

const JAZZ_KEY = "spleckt-games-jazz";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let jazzGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let jazzTimer: number | null = null;
let jazzOn = false;
let step = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeJazz(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readJazzEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(JAZZ_KEY) === "1";
}

export function getJazzEnabled() {
  return jazzOn;
}

function ensureCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    jazzGain = ctx.createGain();
    jazzGain.gain.value = 0.55;
    jazzGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.9;
    sfxGain.connect(master);
  }
  void ctx.resume();
  return ctx;
}

function tone(
  audio: AudioContext,
  dest: AudioNode,
  type: OscillatorType,
  freq: number,
  when: number,
  dur: number,
  gain = 0.12,
  slide?: number,
) {
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), when + dur);
  env.gain.setValueAtTime(0.0001, when);
  env.gain.exponentialRampToValueAtTime(gain, when + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(env);
  env.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

function noiseBurst(audio: AudioContext, dest: AudioNode, when: number, dur: number, gain = 0.04) {
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * dur), audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 4000;
  const env = audio.createGain();
  env.gain.setValueAtTime(gain, when);
  env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  src.connect(filter);
  filter.connect(env);
  env.connect(dest);
  src.start(when);
  src.stop(when + dur);
}

const BASS = [98, 123.47, 146.83, 130.81, 110, 98, 92.5, 87.31];
const CHORDS = [
  [261.63, 329.63, 392.0],
  [293.66, 349.23, 440.0],
  [329.63, 415.3, 493.88],
  [246.94, 311.13, 392.0],
];

function scheduleBar() {
  const audio = ctx;
  const dest = jazzGain;
  if (!audio || !dest || !jazzOn) return;
  const now = audio.currentTime + 0.05;
  const beat = 0.28;
  const chord = CHORDS[step % CHORDS.length]!;
  const bass = BASS[step % BASS.length]!;
  tone(audio, dest, "triangle", bass, now, beat * 1.6, 0.16);
  tone(audio, dest, "triangle", bass * 2, now + beat * 2, beat * 0.7, 0.05);
  if (step % 2 === 0) {
    for (const freq of chord) {
      tone(audio, dest, "sine", freq / 2, now + beat, beat * 1.4, 0.035);
    }
  }
  noiseBurst(audio, dest, now, 0.04, 0.03);
  noiseBurst(audio, dest, now + beat * 1.5, 0.03, 0.02);
  noiseBurst(audio, dest, now + beat * 3, 0.04, 0.025);
  step += 1;
}

function startLoop() {
  if (jazzTimer != null) return;
  scheduleBar();
  jazzTimer = window.setInterval(scheduleBar, 1120);
}

function stopLoop() {
  if (jazzTimer != null) {
    window.clearInterval(jazzTimer);
    jazzTimer = null;
  }
}

export function setJazzEnabled(on: boolean) {
  jazzOn = on;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(JAZZ_KEY, on ? "1" : "0");
  }
  if (on) {
    ensureCtx();
    startLoop();
  } else {
    stopLoop();
  }
  notify();
}

export function toggleJazz() {
  setJazzEnabled(!jazzOn);
  playSfx("click");
}

export function playSfx(name: SfxName) {
  const audio = ensureCtx();
  const dest = sfxGain;
  if (!audio || !dest) return;
  const now = audio.currentTime + 0.01;
  if (name === "drop") {
    tone(audio, dest, "square", 220, now, 0.14, 0.1, 90);
  } else if (name === "place") {
    tone(audio, dest, "triangle", 180, now, 0.1, 0.08, 90);
  } else if (name === "card") {
    noiseBurst(audio, dest, now, 0.07, 0.08);
    tone(audio, dest, "triangle", 520, now, 0.06, 0.04);
  } else if (name === "hit") {
    tone(audio, dest, "sine", 880, now, 0.16, 0.12);
    tone(audio, dest, "sine", 1320, now + 0.02, 0.12, 0.08);
  } else if (name === "miss") {
    tone(audio, dest, "triangle", 240, now, 0.18, 0.08, 80);
    noiseBurst(audio, dest, now, 0.12, 0.05);
  } else if (name === "win") {
    tone(audio, dest, "sine", 523.25, now, 0.22, 0.12);
    tone(audio, dest, "sine", 659.25, now + 0.12, 0.22, 0.12);
    tone(audio, dest, "sine", 783.99, now + 0.24, 0.35, 0.14);
  } else {
    tone(audio, dest, "square", 1400, now, 0.04, 0.05);
  }
}

export function bootJazzFromStorage() {
  if (readJazzEnabled()) setJazzEnabled(true);
}
