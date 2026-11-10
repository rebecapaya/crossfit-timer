// types
export type Mode = "fortime" | "amrap" | "emom";

type Base = { prepSec: number; title?: string };

export type ForTime = Base & { mode: "fortime"; capSec: number };
export type Amrap = Base & { mode: "amrap"; durationSec: number };
export type Emom = Base & { mode: "emom"; intervalSec: number; rounds: number };

export type Workout = ForTime | Amrap | Emom;

// limits

export const LIMITS = {
  prepSec:     { min: 0,  max: 60 },
  capSec:      { min: 60, max: 3600 },  // For Time: 1 min – 60 min
  durationSec: { min: 60, max: 3600 },  // AMRAP:    1 min – 60 min
  intervalSec: { min: 10, max: 600 },   // EMOM:     10 s – 10 min per interval
  rounds:      { min: 1,  max: 60 },    // EMOM:     1 – 60 rounds
} as const;

export const TITLE_MAX_LENGTH = 40;

// default values
export const DEFAULTS = {
  prepSec: 10,
  capSec: 1200,      // 20 min
  durationSec: 720,  // 12 min
  intervalSec: 60,   // 1 min
  rounds: 10,
} as const;

export type LimitedField = keyof typeof LIMITS;

// Integer within the field's limits?
export function isInRange(field: LimitedField, value: unknown): value is number {
  const { min, max } = LIMITS[field];
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

// Default workout for a mode
export function defaultWorkout(mode: Mode): Workout {
  switch (mode) {
    case "fortime":
      return { mode, prepSec: DEFAULTS.prepSec, capSec: DEFAULTS.capSec };
    case "amrap":
      return { mode, prepSec: DEFAULTS.prepSec, durationSec: DEFAULTS.durationSec };
    case "emom":
      return {
        mode,
        prepSec: DEFAULTS.prepSec,
        intervalSec: DEFAULTS.intervalSec,
        rounds: DEFAULTS.rounds,
      };
  }
}

// validation

export function validateWorkout(input: unknown): Workout | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const obj = input as Record<string, unknown>;

  const prepSec = obj.prepSec;
  if (!isInRange("prepSec", prepSec)) return null;

  const base: { prepSec: number; title?: string } = { prepSec };
  if (obj.title !== undefined) {
    if (typeof obj.title !== "string") return null;
    const title = Array.from(obj.title.trim()).slice(0, TITLE_MAX_LENGTH).join("");
    if (title) base.title = title;
  }

  switch (obj.mode) {
    case "fortime": {
      const capSec = obj.capSec;
      if (!isInRange("capSec", capSec)) return null;
      return { ...base, mode: "fortime", capSec };
    }
    case "amrap": {
      const durationSec = obj.durationSec;
      if (!isInRange("durationSec", durationSec)) return null;
      return { ...base, mode: "amrap", durationSec };
    }
    case "emom": {
      const intervalSec = obj.intervalSec;
      const rounds = obj.rounds;
      if (!isInRange("intervalSec", intervalSec)) return null;
      if (!isInRange("rounds", rounds)) return null;
      return { ...base, mode: "emom", intervalSec, rounds };
    }
    default:
      return null;
  }
}

// URL encoding

export function encodeWorkout(w: Workout): string {
  return encodeURIComponent(JSON.stringify(w));
}

export function decodeWorkout(str: string): Workout | null {
  try {
    return validateWorkout(JSON.parse(decodeURIComponent(str)));
  } catch {
    return null;
  }
}

// Work duration in seconds (without prep)
export function totalDurationSec(w: Workout): number {
  switch (w.mode) {
    case "fortime": return w.capSec;
    case "amrap":   return w.durationSec;
    case "emom":    return w.intervalSec * w.rounds;
  }
}