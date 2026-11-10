"use client";

import { useId } from "react";

export type DurationValue = { min: string; sec: string };

type Props = {
  label: string;
  value: DurationValue;
  onChange: (v: DurationValue) => void;
  error?: string;
};

function clean(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 2);
}

export function toSeconds(v: DurationValue): number {
  if (v.min === "" && v.sec === "") return NaN;
  const m = v.min === "" ? 0 : Number(v.min);
  const s = v.sec === "" ? 0 : Number(v.sec);
  if (!Number.isInteger(m) || !Number.isInteger(s) || s > 59) return NaN;
  return m * 60 + s;
}

export function fromSeconds(total: number): DurationValue {
  return {
    min: String(Math.floor(total / 60)),
    sec: String(total % 60).padStart(2, "0"),
  };
}

export default function DurationInput({ label, value, onChange, error }: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = Boolean(error);

  const common = {
    type: "text",
    inputMode: "numeric",
    pattern: "[0-9]*",
    autoComplete: "off",
    placeholder: "00",
    "aria-invalid": invalid,
    "aria-describedby": invalid ? errorId : undefined,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
  } as const;

  return (
    <fieldset className="field">
      <legend>{label}</legend>

      <div className="duration">
        <input
          {...common}
          id={`${id}-min`}
          aria-label={`${label}, minutes`}
          value={value.min}
          onChange={(e) => onChange({ ...value, min: clean(e.target.value) })}
        />
        <span aria-hidden="true">:</span>
        <input
          {...common}
          id={`${id}-sec`}
          aria-label={`${label}, seconds`}
          value={value.sec}
          onChange={(e) => onChange({ ...value, sec: clean(e.target.value) })}
          onBlur={() => {
            if (value.sec.length === 1) onChange({ ...value, sec: value.sec.padStart(2, "0") });
          }}
        />
        <span className="duration-hint">min : sec</span>
      </div>

      {error && (
        <p id={errorId} className="error">
          {error}
        </p>
      )}
    </fieldset>
  );
}