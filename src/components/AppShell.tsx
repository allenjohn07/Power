import { DesktopSidebar, MobileTabBar } from "@/components/AppNav";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Mobile: narrow column + fixed bottom tabs.
 * Desktop: sidebar + wider content panel (no bottom tabs).
 */
export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="flex h-dvh min-h-0 flex-col bg-zinc-50">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-1 flex-col md:max-w-6xl md:flex-row md:gap-8 md:px-6 md:py-6">
        <DesktopSidebar />

        <div
          className={cn(
            "relative flex min-h-0 w-full flex-1 flex-col bg-background md:max-w-3xl md:rounded-xl md:border md:border-border md:shadow-sm",
            className,
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </div>
        </div>
       </div>

      <MobileTabBar />
    </div>
  );
}
