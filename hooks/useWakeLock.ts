import { useEffect, useRef, useState } from "react";

export function useWakeLock(active: boolean): { supported: boolean; locked: boolean } {
  const [supported, setSupported] = useState(false);
  const [locked, setLocked] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setSupported("wakeLock" in navigator);
  }, []);

  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let cancelled = false;

    const request = async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      if (sentinelRef.current && !sentinelRef.current.released) return;

      try {
        const sentinel = await navigator.wakeLock.request("screen");

        if (cancelled) {
          void sentinel.release();
          return;
        }

        sentinelRef.current = sentinel;
        setLocked(true);

        sentinel.addEventListener("release", () => {
          if (sentinelRef.current === sentinel) {
            sentinelRef.current = null;
            setLocked(false);
          }
        });
      } catch {
        setLocked(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      if (sentinel && !sentinel.released) void sentinel.release();
      setLocked(false);
    };
  }, [active]);

  return { supported, locked };
}