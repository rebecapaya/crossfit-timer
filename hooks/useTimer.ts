import { useCallback, useEffect, useRef, useState } from "react";
import type { Workout } from "@/lib/workout";
import { getCue, getState, type TimerState } from "@/lib/timeline";
import { playCue } from "@/lib/sound";

export type Status = "idle" | "running" | "paused" | "finished";

const TICK_MS = 100;
const STALE_MS = 1000;

function sameState(a: TimerState, b: TimerState): boolean {
  return a.phase === b.phase && a.displaySec === b.displaySec && a.round === b.round;
}

export function useTimer(w: Workout) {
  const [status, setStatus] = useState<Status>("idle");
  const [state, setState] = useState<TimerState>(() => getState(w, 0));

  const statusRef = useRef<Status>("idle");
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);
  const prevRef = useRef<TimerState | null>(null);
  const lastTickAtRef = useRef(0);
  const wasHiddenRef = useRef(false);

  const changeStatus = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const tick = useCallback(() => {
    if (statusRef.current !== "running") return;

    const now = Date.now();
    const visible = document.visibilityState === "visible";
    const gap = now - lastTickAtRef.current;
    lastTickAtRef.current = now;

    const elapsed = accumulatedRef.current + (now - startedAtRef.current);
    const next = getState(w, elapsed);
    const prev = prevRef.current;

    const silent = !visible || wasHiddenRef.current || gap > STALE_MS;
    if (visible) wasHiddenRef.current = false;

    if (!silent) {
      const cue = getCue(prev, next, w);
      if (cue) playCue(cue);
    }

    prevRef.current = next;
    if (!prev || !sameState(prev, next)) setState(next);

    if (next.phase === "done") {
      accumulatedRef.current = elapsed;
      changeStatus("finished");
    }
  }, [w, changeStatus]);

  useEffect(() => {
    if (status !== "running") return;

    const id = window.setInterval(tick, TICK_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasHiddenRef.current = true;
      } else {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [status, tick]);

  // actions
  const start = useCallback(() => {
    const now = Date.now();
    accumulatedRef.current = 0;
    startedAtRef.current = now;
    lastTickAtRef.current = now;
    wasHiddenRef.current = false;
    prevRef.current = null;
    setState(getState(w, 0));
    changeStatus("running");
  }, [w, changeStatus]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    accumulatedRef.current += Date.now() - startedAtRef.current;
    changeStatus("paused");
  }, [changeStatus]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    const now = Date.now();
    startedAtRef.current = now;
    lastTickAtRef.current = now;
    changeStatus("running");
  }, [changeStatus]);

  const reset = useCallback(() => {
    accumulatedRef.current = 0;
    prevRef.current = null;
    setState(getState(w, 0));
    changeStatus("idle");
  }, [w, changeStatus]);

  return { state, status, start, pause, resume, reset };
}