"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { Workout } from "@/lib/workout";
import { formatTime, type TimerState } from "@/lib/timeline";
import type { Status } from "@/hooks/useTimer";

type Props = {
  workout: Workout;
  state: TimerState;
  status: Status;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onRestart: () => void;
};

type Tone = "prep" | "work" | "warn" | "done" | "paused";

const MODE_LABEL: Record<Workout["mode"], string> = {
  fortime: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
};

const CONTROLS_MS = 3000;

// Which colour scheme to use right now
function getTone(workout: Workout, state: TimerState, status: Status): Tone {
  if (status === "paused") return "paused";
  if (state.phase === "prep") return "prep";
  if (state.phase === "done") return "done";

  // Last 3 seconds of the work phase: red digits
  const secondsLeft =
    workout.mode === "fortime" ? workout.capSec - state.displaySec : state.displaySec;
  return secondsLeft <= 3 ? "warn" : "work";
}

function getLabel(workout: Workout, state: TimerState, status: Status): string {
  if (status === "paused") return "PAUSED";
  if (state.phase === "prep") return "READY";
  if (state.phase === "work") return "GO";
  return workout.mode === "fortime" ? "TIME CAP" : "FINISHED";
}

export default function TimerDisplay({
  workout,
  state,
  status,
  onPause,
  onResume,
  onReset,
  onRestart,
}: Props) {
  const [showControls, setShowControls] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const reveal = () => {
    setShowControls(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setShowControls(false);
      setConfirmReset(false);
    }, CONTROLS_MS);
  };

  const handle = (action: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    action();
    reveal();
  };

  const handleReset = (e: MouseEvent) => {
    e.stopPropagation();
    if (confirmReset) {
      setConfirmReset(false);
      setShowControls(false);
      onReset();
    } else {
      setConfirmReset(true);
      reveal();
    }
  };

  const tone = getTone(workout, state, status);
  const label = getLabel(workout, state, status);
  const time = formatTime(state.displaySec);
  const mode = MODE_LABEL[workout.mode];
  const header = workout.title ? `${mode} · ${workout.title}` : mode;

  const controlsVisible = status === "paused" || status === "finished" || showControls;

  return (
    <main className="timer" data-tone={tone} onClick={reveal}>
      <header className="timer-header">
        <span className="timer-title">{header}</span>
        {state.round !== undefined && state.totalRounds !== undefined && (
          <span className="timer-round">
            {state.round} / {state.totalRounds}
          </span>
        )}
      </header>

      <div
        className={`timer-digits${time.length > 5 ? " timer-digits--long" : ""}`}
        role="timer"
        aria-live="off"
      >
        {time}
      </div>

      <footer className="timer-footer">
        <span className="timer-label">{label}</span>
        {workout.mode === "fortime" && <span>Cap {formatTime(workout.capSec)}</span>}
      </footer>

      {controlsVisible && (
        <div className="timer-controls">
          {status === "running" && <button onClick={handle(onPause)}>⏸ Pause</button>}
          {status === "paused" && <button onClick={handle(onResume)}>▶ Resume</button>}
          {(status === "running" || status === "paused") && (
            <button className={confirmReset ? "danger" : undefined} onClick={handleReset}>
              {confirmReset ? "Tap again to reset" : "↺ Reset"}
            </button>
          )}
          {status === "finished" && (
            <>
              <button onClick={handle(onRestart)}>↺ Restart</button>
              <button onClick={handle(onReset)}>✕ Close</button>
            </>
          )}
        </div>
      )}
    </main>
  );
}