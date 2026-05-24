"use client";

import { motion } from "framer-motion";
import { springs } from "@/lib/springs";

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

/** Gentle page entry — wrap main content inside AppShell. */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className={className}
    >
      {children}
    </motion.div>
  );
}
