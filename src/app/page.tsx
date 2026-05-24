import { Suspense } from "react";
import HomeFeed from "./HomeFeed";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background p-4">
          <p className="rounded-xl bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
            Loading…
          </p>
        </div>
      }
    >
      <HomeFeed />
    </Suspense>
  );
}
