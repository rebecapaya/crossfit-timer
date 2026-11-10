"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import { describeWorkout, encodeWorkout, MODE_NAME, type Workout } from "@/lib/workout";

const noopSubscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => null;

type Props = {
  workout: Workout | null;
};

export default function ShareQR({ workout }: Props) {
  const origin = useSyncExternalStore(noopSubscribe, getOrigin, getServerOrigin);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const url = workout && origin ? `${origin}/timer#${encodeWorkout(workout)}` : null;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      inputRef.current?.select();
      return;
    }
    setCopied(true);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="share" aria-labelledby="share-title">
      <h2 id="share-title">Send to the phone</h2>

      {url && workout ? (
        <>
          <div className="qr-card">
            <QRCodeSVG
              value={url}
              size={256}
              level="M"
              marginSize={2}
              title="Scan to open the timer"
            />
          </div>

          <p className="share-summary">
            <strong>{MODE_NAME[workout.mode]}</strong>
            {workout.title && ` · ${workout.title}`}
            <br />
            {describeWorkout(workout)}
            {workout.prepSec > 0 && ` · ${workout.prepSec} s countdown`}
          </p>

          <p className="share-help">Scan with the phone camera to open the timer.</p>

          <div className="share-link">
            <input
              ref={inputRef}
              readOnly
              value={url}
              aria-label="Timer link"
              onFocus={(e) => e.target.select()}
            />
            <button type="button" onClick={copy}>
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>

          <a className="share-open" href={url} target="_blank" rel="noopener noreferrer">
            Open timer in a new tab ↗
          </a>
        </>
      ) : (
        <div className="qr-placeholder">
          {/* Empty while loading on the server; message only when the form is invalid */}
          {origin !== null && "Fix the errors to get the QR code"}
        </div>
      )}
    </section>
  );
}