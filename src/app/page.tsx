import { Suspense } from "react";
import HomeFeed from "./HomeFeed";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <HomeFeed />
    </Suspense>
  );
}
