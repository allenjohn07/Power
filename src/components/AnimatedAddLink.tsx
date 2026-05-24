"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { springs } from "@/lib/springs";
import { cn } from "@/lib/utils";

type AnimatedAddLinkProps = {
  href: string;
  className?: string;
};

/** Outline Add CTA — matches dark mockup header. */
export function AnimatedAddLink({ href, className }: AnimatedAddLinkProps) {
  const [added, setAdded] = useState(false);

  return (
    <motion.div whileTap={{ scale: 0.92 }} transition={springs.snappy}>
      <Link
        href={href}
        onClick={() => {
          setAdded(true);
        }}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/80",
          className,
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {added ? (
            <motion.span
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={springs.bouncy}
              className="flex"
            >
              <Check className="size-3.5" aria-hidden />
            </motion.span>
          ) : (
            <motion.span
              key="plus"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={springs.bouncy}
              className="flex"
            >
              <Plus className="size-3.5" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
        {added ? "…" : "Add"}
      </Link>
    </motion.div>
  );
}
