import type { Transition } from "framer-motion";

export const springs = {
  snappy: { type: "spring", stiffness: 500, damping: 30 },
  bouncy: { type: "spring", stiffness: 400, damping: 20 },
  soft: { type: "spring", stiffness: 200, damping: 28 },
  gentle: { type: "spring", stiffness: 120, damping: 20 },
} as const satisfies Record<string, Transition>;
