import { springs } from "@/lib/springs";

export const feedContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export const feedCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.bouncy,
  },
};
