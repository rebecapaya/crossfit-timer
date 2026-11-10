"use client";

import { useEffect, useId, useMemo, useState } from "react";
import DurationInput, { fromSeconds, toSeconds, type DurationValue } from "./DurationInput";
import { formatTime } from "@/lib/timeline";
import {
  DEFAULTS,
  LIMITS,
  TITLE_MAX_LENGTH,
  isInRange,
  validateWorkout,
  type LimitedField,
  type Mode,
  type Workout,
} from "@/lib/workout";

type Draft = {
  mode: Mode;
  title: string;
  prepSec: number;
  cap: DurationValue;      // For Time
  duration: DurationValue; // AMRAP
  interval: DurationValue; // EMOM
  rounds: string;          // EMOM
};

const INITIAL_DRAFT: Draft = {
  mode: "amrap",
  title: "",
  prepSec: DEFAULTS.prepSec,
  cap: fromSeconds(DEFAULTS.capSec),
  duration: fromSeconds(DEFAULTS.durationSec),
  interval: fromSeconds(DEFAULTS.intervalSec),
  rounds: String(DEFAULTS.rounds),
};

const MODES: { value: Mode; label: string }[] = [
  { value: "fortime", label: "For Time" },
  { value: "amrap", label: "AMRAP" },
  { value: "emom", label: "EMOM" },
];

const PREP_OPTIONS = [0, 5, 10, 15, 20, 30];

const PRESETS: { label: string; patch: Partial<Draft> }[] = [
  { label: "AMRAP 20", patch: { mode: "amrap", duration: fromSeconds(1200) } },
  { label: "EMOM 10 × 1:00", patch: { mode: "emom", interval: fromSeconds(60), rounds: "10" } },
  { label: "For Time · cap 15", patch: { mode: "fortime", cap: fromSeconds(900) } },
];

function buildWorkout(d: Draft): Workout | null {
  const base = { prepSec: d.prepSec, title: d.title };
  switch (d.mode) {
    case "fortime":
      return validateWorkout({ ...base, mode: "fortime", capSec: toSeconds(d.cap) });
    case "amrap":
      return validateWorkout({ ...base, mode: "amrap", durationSec: toSeconds(d.duration) });
    case "emom":
      return validateWorkout({
        ...base,
        mode: "emom",
        intervalSec: toSeconds(d.interval),
        rounds: d.rounds === "" ? NaN : Number(d.rounds),
      });
  }
}

export const INITIAL_WORKOUT = buildWorkout(INITIAL_DRAFT);

// error messages
type Errors = Partial<Record<"cap" | "duration" | "interval" | "rounds", string>>;

function rangeError(field: LimitedField, value: number, unit?: string): string | undefined {
  if (isInRange(field, value)) return undefined;
  const { min, max } = LIMITS[field];
  return unit
    ? `Between ${min} and ${max} ${unit}`
    : `Between ${formatTime(min)} and ${formatTime(max)}`;
}

function getErrors(d: Draft): Errors {
  switch (d.mode) {
    case "fortime":
      return { cap: rangeError("capSec", toSeconds(d.cap)) };
    case "amrap":
      return { duration: rangeError("durationSec", toSeconds(d.duration)) };
    case "emom":
      return {
        interval: rangeError("intervalSec", toSeconds(d.interval)),
        rounds: rangeError("rounds", d.rounds === "" ? NaN : Number(d.rounds), "rounds"),
      };
  }
}

type Props = {
  onChange: (w: Workout | null) => void;
};

export default function WorkoutForm({ onChange }: Props) {
  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);
  const id = useId();

  const workout = useMemo(() => buildWorkout(draft), [draft]);
  const errors = useMemo(() => getErrors(draft), [draft]);

  useEffect(() => {
    onChange(workout);
  }, [workout, onChange]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const emomTotal =
    draft.mode === "emom" && workout?.mode === "emom"
      ? `${workout.rounds} × ${formatTime(workout.intervalSec)} = ${formatTime(
          workout.intervalSec * workout.rounds,
        )}`
      : null;

  return (
    <form className="workout-form" onSubmit={(e) => e.preventDefault()}>
      {/* Mode */}
      <div className="field">
        <span className="field-label" id={`${id}-mode`}>
          Mode
        </span>
        <div className="segmented" role="group" aria-labelledby={`${id}-mode`}>
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={draft.mode === m.value}
              onClick={() => set("mode", m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode-specific fields */}
      {draft.mode === "fortime" && (
        <DurationInput
          label="Time cap"
          value={draft.cap}
          onChange={(v) => set("cap", v)}
          error={errors.cap}
        />
      )}

      {draft.mode === "amrap" && (
        <DurationInput
          label="Duration"
          value={draft.duration}
          onChange={(v) => set("duration", v)}
          error={errors.duration}
        />
      )}

      {draft.mode === "emom" && (
        <>
          <DurationInput
            label="Every"
            value={draft.interval}
            onChange={(v) => set("interval", v)}
            error={errors.interval}
          />

          <div className="field">
            <label htmlFor={`${id}-rounds`}>Rounds</label>
            <input
              id={`${id}-rounds`}
              className="input-short"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={draft.rounds}
              aria-invalid={Boolean(errors.rounds)}
              aria-describedby={errors.rounds ? `${id}-rounds-error` : undefined}
              onFocus={(e) => e.target.select()}
              onChange={(e) => set("rounds", e.target.value.replace(/\D/g, "").slice(0, 2))}
            />
            {errors.rounds && (
              <p id={`${id}-rounds-error`} className="error">
                {errors.rounds}
              </p>
            )}
          </div>

          {emomTotal && <p className="form-hint">Total: {emomTotal}</p>}
        </>
      )}

      {/* Common fields */}
      <div className="field">
        <label htmlFor={`${id}-title`}>
          Title <span className="optional">(optional)</span>
        </label>
        <input
          id={`${id}-title`}
          type="text"
          maxLength={TITLE_MAX_LENGTH}
          placeholder="e.g. Fran"
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor={`${id}-prep`}>Countdown before start</label>
        <select
          id={`${id}-prep`}
          value={draft.prepSec}
          onChange={(e) => set("prepSec", Number(e.target.value))}
        >
          {PREP_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 0 ? "None" : `${s} seconds`}
            </option>
          ))}
        </select>
      </div>

      {/* Presets */}
      <div className="field">
        <span className="field-label">Quick presets</span>
        <div className="presets">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => setDraft((d) => ({ ...d, ...p.patch }))}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}