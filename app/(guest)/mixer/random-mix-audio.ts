// Audio for the random-mix slot machine.
//
// Two short mp3 samples power the case-opening feel:
//   /sfx/random-spin.mp3   — long reel-spin sound, played once per roll
//   /sfx/random-thunk.mp3  — short "lock" hit, played per reel as it stops
//
// The bonus chime (overpack/cool) is still synthesized via OscillatorNode —
// no file needed for that little sparkle.

const MUTE_KEY = "shelter.mixer.random.muted";
const SPIN_URL = "/sfx/random-spin.mp3";
const THUNK_URL = "/sfx/random-thunk.mp3";

let ctx: AudioContext | null = null;
let muted = readPersistedMute();

let spinBuffer: AudioBuffer | null = null;
let thunkBuffer: AudioBuffer | null = null;
let spinLoading: Promise<AudioBuffer | null> | null = null;
let thunkLoading: Promise<AudioBuffer | null> | null = null;

function readPersistedMute(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  if (!Number.isFinite(ctx.currentTime)) return null;
  return ctx;
}

async function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const c = getCtx();
  if (!c) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return await new Promise<AudioBuffer | null>((resolve) => {
      c.decodeAudioData(
        arr,
        (buf) => resolve(buf),
        () => resolve(null),
      );
    });
  } catch {
    return null;
  }
}

function ensureSpin(): Promise<AudioBuffer | null> {
  if (spinBuffer) return Promise.resolve(spinBuffer);
  if (!spinLoading) {
    spinLoading = loadBuffer(SPIN_URL).then((buf) => {
      spinBuffer = buf;
      return buf;
    });
  }
  return spinLoading;
}

function ensureThunk(): Promise<AudioBuffer | null> {
  if (thunkBuffer) return Promise.resolve(thunkBuffer);
  if (!thunkLoading) {
    thunkLoading = loadBuffer(THUNK_URL).then((buf) => {
      thunkBuffer = buf;
      return buf;
    });
  }
  return thunkLoading;
}

/** Called from the click that opens the sheet so iOS authorizes audio
 *  inside an active gesture, and so the mp3s start downloading early. */
export function unlockAudio(): void {
  getCtx();
  // Kick off downloads but don't wait — first roll may use buffers as
  // they become available, subsequent rolls hit the cache.
  ensureSpin();
  ensureThunk();
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export type ScheduledAudio = { cancel: () => void };

const NOOP: ScheduledAudio = { cancel: () => {} };

/**
 * Play the reel-spin sample once. Returns a handle so the parent can stop
 * it early (e.g. when the user closes the sheet mid-spin or rerolls).
 */
export function playSpin(): ScheduledAudio {
  if (muted) return NOOP;
  const c = getCtx();
  if (!c) return NOOP;
  let source: AudioBufferSourceNode | null = null;
  let gain: GainNode | null = null;
  let cancelled = false;
  ensureSpin().then((buf) => {
    if (!buf || cancelled || muted) return;
    const ctxNow = getCtx();
    if (!ctxNow) return;
    source = ctxNow.createBufferSource();
    gain = ctxNow.createGain();
    source.buffer = buf;
    gain.gain.value = 0.85;
    source.connect(gain).connect(ctxNow.destination);
    try {
      source.start(0);
    } catch {
      /* already stopped */
    }
  });
  return {
    cancel: () => {
      cancelled = true;
      if (!source || !gain) return;
      const c2 = getCtx();
      if (!c2) return;
      const now = c2.currentTime;
      try {
        // Quick fade-out so it doesn't click when cut short.
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        source.stop(now + 0.1);
      } catch {
        /* already stopped */
      }
    },
  };
}

/** Short "lock" when a reel settles. Pitch shifts per reel for variety. */
export function playThunk(reelIndex: number): void {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  ensureThunk().then((buf) => {
    if (!buf || muted) return;
    const ctxNow = getCtx();
    if (!ctxNow) return;
    const source = ctxNow.createBufferSource();
    const gain = ctxNow.createGain();
    source.buffer = buf;
    // 0.92, 0.97, 1.03, 1.08 — subtle ascending pitch across the row.
    const safeIndex = Number.isFinite(reelIndex) ? reelIndex : 0;
    source.playbackRate.value = 0.92 + safeIndex * 0.05;
    gain.gain.value = 1;
    source.connect(gain).connect(ctxNow.destination);
    try {
      source.start(0);
    } catch {
      /* ignore */
    }
  });
}

/** Sparkle arpeggio when a bonus (overpack/cool) rolls — synthesized. */
export function playBonusChime(): void {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  if (!Number.isFinite(c.currentTime)) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const when = c.currentTime + i * 0.08;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain).connect(c.destination);
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.14, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.32);
    osc.start(when);
    osc.stop(when + 0.34);
  });
}
