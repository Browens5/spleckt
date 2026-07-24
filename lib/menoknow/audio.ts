/** Procedural farm music + SFX via Web Audio (no binary assets). */

type Tone = { freq: number; dur: number; type?: OscillatorType; gain?: number };

let sharedCtx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCtx) sharedCtx = new AudioCtx();
  return sharedCtx;
}

async function ensureRunning(ctx: AudioContext) {
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // ignore autoplay blocks until next gesture
    }
  }
}

function playTone(ctx: AudioContext, tone: Tone, when = 0, masterGain = 0.2) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tone.type ?? "sine";
  osc.frequency.value = tone.freq;
  const peak = (tone.gain ?? 0.22) * masterGain;
  const start = ctx.currentTime + when;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + tone.dur + 0.02);
}

const MELODY = [
  392, 440, 494, 523, 494, 440, 392, 349, 392, 440, 392, 330, 349, 392, 349, 294,
];

export class FarmAudio {
  muted = false;
  musicOn = true;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private unlocked = false;

  async unlock() {
    const ctx = getCtx();
    if (!ctx) return;
    await ensureRunning(ctx);
    this.unlocked = true;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.stopMusic();
    else if (this.musicOn && this.unlocked) this.startMusic();
  }

  setMusicOn(on: boolean) {
    this.musicOn = on;
    if (!on) this.stopMusic();
    else if (!this.muted && this.unlocked) this.startMusic();
  }

  async startMusic() {
    if (this.muted || !this.musicOn) return;
    await this.unlock();
    if (this.musicTimer) return;
    const ctx = getCtx();
    if (!ctx) return;

    const tick = () => {
      if (this.muted || !this.musicOn) return;
      const note = MELODY[this.step % MELODY.length]!;
      playTone(
        ctx,
        { freq: note, dur: 0.38, type: "triangle", gain: 0.07 },
        0,
        1,
      );
      // soft fifth harmony
      playTone(
        ctx,
        { freq: note * 1.5, dur: 0.28, type: "sine", gain: 0.035 },
        0.02,
        1,
      );
      this.step += 1;
    };

    tick();
    this.musicTimer = setInterval(tick, 520);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private async blip(tones: Tone[]) {
    if (this.muted) return;
    await this.unlock();
    const ctx = getCtx();
    if (!ctx) return;
    let t = 0;
    for (const tone of tones) {
      playTone(ctx, tone, t, 1);
      t += Math.min(tone.dur * 0.55, 0.12);
    }
  }

  tap() {
    return this.blip([{ freq: 660, dur: 0.08, type: "sine", gain: 0.12 }]);
  }

  pop() {
    return this.blip([
      { freq: 520, dur: 0.07, type: "triangle", gain: 0.14 },
      { freq: 780, dur: 0.09, type: "sine", gain: 0.1 },
    ]);
  }

  moo() {
    return this.blip([
      { freq: 180, dur: 0.22, type: "sawtooth", gain: 0.05 },
      { freq: 140, dur: 0.28, type: "triangle", gain: 0.07 },
      { freq: 120, dur: 0.2, type: "sine", gain: 0.05 },
    ]);
  }

  success() {
    return this.blip([
      { freq: 523, dur: 0.12, type: "sine", gain: 0.14 },
      { freq: 659, dur: 0.12, type: "sine", gain: 0.14 },
      { freq: 784, dur: 0.18, type: "triangle", gain: 0.16 },
    ]);
  }

  oops() {
    return this.blip([
      { freq: 240, dur: 0.14, type: "triangle", gain: 0.1 },
      { freq: 180, dur: 0.18, type: "sine", gain: 0.08 },
    ]);
  }

  whoosh() {
    return this.blip([
      { freq: 420, dur: 0.08, type: "sine", gain: 0.06 },
      { freq: 560, dur: 0.1, type: "triangle", gain: 0.07 },
      { freq: 320, dur: 0.12, type: "sine", gain: 0.05 },
    ]);
  }

  star() {
    return this.blip([
      { freq: 880, dur: 0.1, type: "sine", gain: 0.12 },
      { freq: 1320, dur: 0.16, type: "triangle", gain: 0.1 },
    ]);
  }

  dispose() {
    this.stopMusic();
  }
}

let farmAudio: FarmAudio | null = null;

export function getFarmAudio() {
  if (!farmAudio) farmAudio = new FarmAudio();
  return farmAudio;
}
