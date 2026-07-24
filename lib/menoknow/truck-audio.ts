/** Procedural monster-truck music + SFX via Web Audio. */

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
      // wait for next gesture
    }
  }
}

function playTone(ctx: AudioContext, tone: Tone, when = 0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tone.type ?? "sine";
  osc.frequency.value = tone.freq;
  const peak = tone.gain ?? 0.18;
  const start = ctx.currentTime + when;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + tone.dur + 0.02);
}

const BEAT = [196, 247, 294, 330, 294, 247, 220, 196];

export class TruckAudio {
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
    else if (this.musicOn && this.unlocked) void this.startMusic();
  }

  setMusicOn(on: boolean) {
    this.musicOn = on;
    if (!on) this.stopMusic();
    else if (!this.muted && this.unlocked) void this.startMusic();
  }

  async startMusic() {
    if (this.muted || !this.musicOn) return;
    await this.unlock();
    if (this.musicTimer) return;
    const ctx = getCtx();
    if (!ctx) return;

    const tick = () => {
      if (this.muted || !this.musicOn) return;
      const note = BEAT[this.step % BEAT.length]!;
      playTone(ctx, { freq: note, dur: 0.28, type: "square", gain: 0.04 });
      playTone(ctx, {
        freq: note * 2,
        dur: 0.18,
        type: "triangle",
        gain: 0.03,
      });
      this.step += 1;
    };
    tick();
    this.musicTimer = setInterval(tick, 420);
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
      playTone(ctx, tone, t);
      t += Math.min(tone.dur * 0.5, 0.1);
    }
  }

  tap() {
    return this.blip([{ freq: 440, dur: 0.07, type: "sine", gain: 0.1 }]);
  }

  engine() {
    return this.blip([
      { freq: 90, dur: 0.16, type: "sawtooth", gain: 0.05 },
      { freq: 120, dur: 0.14, type: "triangle", gain: 0.06 },
    ]);
  }

  jump() {
    return this.blip([
      { freq: 220, dur: 0.1, type: "square", gain: 0.06 },
      { freq: 360, dur: 0.12, type: "triangle", gain: 0.08 },
      { freq: 520, dur: 0.14, type: "sine", gain: 0.07 },
    ]);
  }

  trick() {
    return this.blip([
      { freq: 523, dur: 0.1, type: "sine", gain: 0.12 },
      { freq: 659, dur: 0.1, type: "sine", gain: 0.12 },
      { freq: 784, dur: 0.16, type: "triangle", gain: 0.14 },
      { freq: 1046, dur: 0.12, type: "sine", gain: 0.08 },
    ]);
  }

  stall() {
    return this.blip([
      { freq: 160, dur: 0.16, type: "sawtooth", gain: 0.05 },
      { freq: 110, dur: 0.2, type: "triangle", gain: 0.06 },
    ]);
  }

  whoosh() {
    return this.blip([
      { freq: 480, dur: 0.08, type: "sine", gain: 0.05 },
      { freq: 640, dur: 0.1, type: "triangle", gain: 0.06 },
    ]);
  }

  dispose() {
    this.stopMusic();
  }
}

let truckAudio: TruckAudio | null = null;

export function getTruckAudio() {
  if (!truckAudio) truckAudio = new TruckAudio();
  return truckAudio;
}
