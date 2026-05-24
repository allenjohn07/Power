"use client";

import { AnimatePresence, motion } from "framer-motion";
import { springs } from "@/lib/springs";

type AnimatedVoteCountProps = {
  count: number;
  className?: string;
};

export function AnimatedVoteCount({ count, className }: AnimatedVoteCountProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={count}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={springs.snappy}
        className={className}
      >
        {count}
      </motion.span>
    </AnimatePresence>
  );
}
