"use client";

import { useMemo, useSyncExternalStore } from "react";
import TimerDisplay from "@/components/TimerDisplay";
import { useTimer } from "@/hooks/useTimer";
import { useWakeLock } from "@/hooks/useWakeLock";
import { beepLong, unlockAudio } from "@/lib/sound";
import { formatTime } from "@/lib/timeline";
import { decodeWorkout, type Workout } from "@/lib/workout";

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const getHash = () => window.location.hash.slice(1);
const getServerHash = () => null;

const MODE_NAME: Record<Workout["mode"], string> = {
  fortime: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
};

function describe(w: Workout): string {
  switch (w.mode) {
    case "fortime":
      return `Time cap ${formatTime(w.capSec)}`;
    case "amrap":
      return `${formatTime(w.durationSec)}`;
    case "emom":
      return `${w.rounds} × ${formatTime(w.intervalSec)}`;
  }
}

async function enterFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement || !el.requestFullscreen) return;
  try {
    await el.requestFullscreen({ navigationUI: "hide" });
  } catch {
    /* denied if we are still in full screen */
  }
}

function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

// page
export default function TimerPage() {
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);
  const workout = useMemo(() => (hash === null ? undefined : decodeWorkout(hash)), [hash]);

  if (workout === undefined) return null;

  if (workout === null) {
    return (
      <main className="message">
        <h1>Invalid workout link</h1>
        <p>Ask the coach for a new QR code or link.</p>
      </main>
    );
  }

  return <TimerScreen key={hash} workout={workout} />;
}

// temporatization screen
function TimerScreen({ workout }: { workout: Workout }) {
  const { state, status, start, pause, resume, reset } = useTimer(workout);
  const { locked } = useWakeLock(status !== "idle");

  const wakeLockSupported = "wakeLock" in navigator;

  const handleStart = () => {
    unlockAudio();
    void enterFullscreen();
    start();
  };

  const handleTestSound = () => {
    unlockAudio();
    beepLong();
  };

  const handleReset = () => {
    reset();
    exitFullscreen();
  };

  if (status === "idle") {
    return (
      <main className="start">
        <p className="start-mode">{MODE_NAME[workout.mode]}</p>
        {workout.title && <h1 className="start-title">{workout.title}</h1>}
        <p className="start-summary">
          {describe(workout)}
          <br />
          {workout.prepSec > 0 ? `${workout.prepSec} s countdown` : "No countdown"}
        </p>

        <div className="start-actions">
          <button className="btn btn-primary" onClick={handleStart}>
            START
          </button>
          <button className="btn" onClick={handleTestSound}>
            🔊 Test sound
          </button>
        </div>

        {!wakeLockSupported && (
          <p className="notice">
            This browser can&apos;t keep the screen on. Turn off auto-lock in the phone settings.
          </p>
        )}

        <ul className="start-tips">
          <li>Turn the volume up and silent mode off</li>
          <li>Place the phone in landscape</li>
        </ul>
      </main>
    );
  }

  return (
    <>
      <TimerDisplay
        workout={workout}
        state={state}
        status={status}
        onPause={pause}
        onResume={resume}
        onReset={handleReset}
        onRestart={start}
      />
      {wakeLockSupported && !locked && (
        <span className="timer-nolock" aria-label="Screen may turn off" />
      )}
    </>
  );
}