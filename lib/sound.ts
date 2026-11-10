import type { Cue } from "./timeline";

let ctx: AudioContext | null = null;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    ctx.addEventListener("statechange", notify);
  }
  return ctx;
}

export function isAudioRunning(): boolean {
  return ctx?.state === "running";
}

export function subscribeAudioState(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function unlockAudio(): void {
  if (typeof window === "undefined") return;

  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) {
    try {
      nav.audioSession.type = "playback";
    } catch {
      /* not supported: continue without it */
    }
  }

  if (ctx && ctx.state !== "running") {
    const old = ctx;
    old.removeEventListener("statechange", notify);
    void old.close().catch(() => {});
    ctx = null;
  }

  const audio = getContext();
  if (!audio) return;
  if (audio.state !== "running") void audio.resume();
  notify();

  const buffer = audio.createBuffer(1, 1, 22050);
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.connect(audio.destination);
  source.start(0);
}

function tone(freq: number, durationMs: number, volume = 0.5): void {
  const audio = getContext();
  if (!audio) return;
  if (audio.state !== "running") void audio.resume();

  const now = audio.currentTime;
  const end = now + durationMs / 1000;

  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.005);
  gain.gain.setValueAtTime(volume, end - 0.02);
  gain.gain.linearRampToValueAtTime(0, end);

  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(end + 0.01);
}

export function beepShort(): void {
  tone(880, 150);
}

export function beepLong(): void {
  tone(1320, 600);
}

export function playCue(cue: Cue): void {
  if (cue === "short") beepShort();
  else beepLong();
}