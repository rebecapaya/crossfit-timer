"use client";

import { useState } from "react";
import WorkoutForm, { INITIAL_WORKOUT } from "./WorkoutForm";
import ShareQR from "./ShareQR";
import type { Workout } from "@/lib/workout";

export default function SetupClient() {
  const [workout, setWorkout] = useState<Workout | null>(INITIAL_WORKOUT);

  return (
    <div className="setup">
      <section className="setup-form" aria-labelledby="setup-form-title">
        <h2 id="setup-form-title">Workout</h2>
        <WorkoutForm onChange={setWorkout} />
      </section>

      <aside className="setup-share">
        <ShareQR workout={workout} />
      </aside>
    </div>
  );
}