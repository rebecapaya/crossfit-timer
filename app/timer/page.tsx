"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import TimerDisplay from "@/components/TimerDisplay";
import { useTimer } from "@/hooks/useTimer";
import { useWakeLock } from "@/hooks/useWakeLock";
import { beepLong, beepShort, markAudioStale, needsAudioUnlock, unlockAudio } from "@/lib/sound";
import { decodeWorkout, describeWorkout, MODE_NAME, type Workout } from "@/lib/workout";

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const getHash = () => window.location.hash.slice(1);
const getServerHash = () => null;

async function enterFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement || !el.requestFullscreen) return;
  try {
    await el.requestFullscreen({ navigationUI: "hide" });
  } catch {
    /* denied: continue without full screen */
  }
}

function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

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

function TimerScreen({ workout }: { workout: Workout }) {
  const { state, status, start, pause, resume, reset } = useTimer(workout);
  const { locked } = useWakeLock(status !== "idle");
  const [soundOff, setSoundOff] = useState(false);

  const wakeLockSupported = "wakeLock" in navigator;

  useEffect(() => {
    if (status === "idle") return;

    const onReturn = () => {
      markAudioStale();
      setSoundOff(true);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") onReturn();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) onReturn();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [status]);

  const handleAnyTap = () => {
    if (needsAudioUnlock()) {
      unlockAudio();
      beepShort();
    }
    setSoundOff(false);
  };

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
          {describeWorkout(workout)}
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
    <div onClickCapture={handleAnyTap}>
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
      {soundOff && <button className="sound-off">🔇 Tap to turn sound back on</button>}
    </div>
  );
}