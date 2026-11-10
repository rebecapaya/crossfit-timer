import type { Workout } from "./workout";

// types
export type Phase = "prep" | "work" | "done";

export type TimerState = {
  phase: Phase;
  displaySec: number; // what is shown big on screen
  direction: "up" | "down"; // whether the clock counts up or down
  round?: number; // EMOM only: current round (1..rounds)
  totalRounds?: number; // EMOM only
};

export type Cue = "short" | "long";

// state

export function getState(w: Workout, elapsedMs: number): TimerState {
  const elapsed = Math.max(0, elapsedMs);
  const prepMs = w.prepSec * 1000;

  if (elapsed < prepMs) {
    return {
      phase: "prep",
      displaySec: Math.ceil((prepMs - elapsed) / 1000),
      direction: "down",
    };
  }

  const t = elapsed - prepMs; // work time in ms

  switch (w.mode) {
    case "fortime": {
      const capMs = w.capSec * 1000;
      if (t >= capMs) {
        return { phase: "done", displaySec: w.capSec, direction: "up" };
      }
      return { phase: "work", displaySec: Math.floor(t / 1000), direction: "up" };
    }

    case "amrap": {
      const durationMs = w.durationSec * 1000;
      if (t >= durationMs) {
        return { phase: "done", displaySec: 0, direction: "down" };
      }
      return {
        phase: "work",
        displaySec: Math.ceil((durationMs - t) / 1000),
        direction: "down",
      };
    }

    case "emom": {
      const intervalMs = w.intervalSec * 1000;
      if (t >= intervalMs * w.rounds) {
        return {
          phase: "done",
          displaySec: 0,
          direction: "down",
          round: w.rounds,
          totalRounds: w.rounds,
        };
      }
      return {
        phase: "work",
        displaySec: Math.ceil((intervalMs - (t % intervalMs)) / 1000),
        direction: "down",
        round: Math.floor(t / intervalMs) + 1,
        totalRounds: w.rounds,
      };
    }
  }
}

// sound cues

export function getCue(prev: TimerState | null, next: TimerState, w: Workout): Cue | null {
  // First frame: beep only if the workout starts directly (no prep)
  if (prev === null) return next.phase === "work" ? "long" : null;

  // Long beep: phase change (prep to work or work to done) or new EMOM round
  if (prev.phase !== next.phase) return "long";
  if (prev.round !== next.round) return "long";

  // Short beeps only when the shown second changes
  if (prev.displaySec === next.displaySec) return null;

  // Counting down: last 3 seconds
  if (next.direction === "down" && next.displaySec >= 1 && next.displaySec <= 3) {
    return "short";
  }

  // For Time: last 3 seconds before the cap
  if (w.mode === "fortime" && next.phase === "work") {
    const left = w.capSec - next.displaySec;
    if (left >= 1 && left <= 3) return "short";
  }

  return null;
}

// format time

export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}