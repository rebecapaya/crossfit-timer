export type Phase = "prep" | "work" | "done";

export type TimerState = {
  phase: Phase;
  displaySec: number;          // lo que se muestra en grande
  direction: "up" | "down";    // si el reloj sube o baja
  round?: number;              // solo EMOM: ronda actual (1..rounds)
  totalRounds?: number;        // solo EMOM
};