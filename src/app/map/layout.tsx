import type { ReactNode } from "react";

export default function MapLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preload" href="/maps/sait-campus-map.svg" as="image" />
      {children}
    </>
  );
}
