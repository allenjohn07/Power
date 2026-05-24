"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Map, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Feed", icon: LayoutGrid, mobileLabel: "Feed" },
  { href: "/map", label: "Map", icon: Map, mobileLabel: "Map" },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, mobileLabel: "Leaderboard" },
  { href: "/account", label: "Account", icon: User, mobileLabel: "Account" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/account") return pathname.startsWith("/account");
  if (href === "/leaderboard") return pathname.startsWith("/leaderboard");
  return pathname === href;
}

function NavLink({
  href,
  label,
  mobileLabel,
  icon: Icon,
  active,
  layout,
}: {
  href: string;
  label: string;
  mobileLabel: string;
  icon: typeof LayoutGrid;
  active: boolean;
  layout: "mobile" | "desktop";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "transition-colors",
        layout === "mobile" &&
          "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-1.5",
        layout === "desktop" &&
          "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium",
        active
          ? layout === "desktop"
            ? "bg-muted text-foreground"
            : "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        layout === "desktop" && !active && "hover:bg-muted/80",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={cn(layout === "mobile" ? "size-5" : "size-4")}
        strokeWidth={active ? 2.25 : 2}
        aria-hidden
      />
      <span
        className={cn(
          layout === "mobile" && "text-[10px] font-medium leading-none",
        )}
      >
        {layout === "mobile" ? mobileLabel : label}
      </span>
    </Link>
  );
}

/** Fixed bottom tab bar — mobile only. */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-md pb-[env(safe-area-inset-bottom)]">
        {links.map(({ href, label, mobileLabel, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            mobileLabel={mobileLabel}
            icon={icon}
            active={isNavActive(pathname, href)}
            layout="mobile"
          />
        ))}
      </div>
    </nav>
  );
}

/** Sidebar navigation — desktop only. */
export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-52 shrink-0 flex-col md:sticky md:top-6 md:flex md:h-[calc(100dvh-3rem)] md:self-start"
      aria-label="Main navigation"
    >
      <Link href="/" className="mb-4 block px-3" aria-label="SAIT Outlets home">
        <Image
          src="/uploads/logo/power-logo.png"
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-full"
          priority
        />
      </Link>
      <nav className="flex flex-col gap-0.5">
        {links.map(({ href, label, mobileLabel, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            mobileLabel={mobileLabel}
            icon={icon}
            active={isNavActive(pathname, href)}
            layout="desktop"
          />
        ))}
      </nav>
      <p className="mt-auto px-3 pt-8 text-xs text-muted-foreground">
        SAIT Campus Plug Directory
      </p>
    </aside>
  );
}

/** @deprecated Use MobileTabBar via AppShell instead. */
export function AppNav() {
  return <MobileTabBar />;
}
