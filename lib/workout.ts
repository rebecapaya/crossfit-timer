export type Mode = "fortime" | "amrap" | "emom";

type Base = { prepSec: number; title?: string };

export type ForTime = Base & { mode: "fortime"; capSec: number };
export type Amrap   = Base & { mode: "amrap"; durationSec: number };
export type Emom    = Base & { mode: "emom"; intervalSec: number; rounds: number };

export type Workout = ForTime | Amrap | Emom;