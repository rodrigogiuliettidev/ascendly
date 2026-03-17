"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Trophy,
  Users,
  User,
  Bell,
  Flame,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const bottomNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/social", label: "Social", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B0B0B]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF9F3F] shadow-lg shadow-[#FF7A00]/20">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Ascendly
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/5"
          >
            <Bell className="h-5 w-5 text-[#A1A1A1]" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF7A00] text-[9px] font-bold text-white">
              3
            </span>
          </Link>
          <Link href="/profile">
            <Avatar className="h-8 w-8 ring-2 ring-[#FF7A00]/30">
              <AvatarFallback className="text-xs">RD</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-[#0B0B0B]/90 backdrop-blur-xl lg:hidden safe-area-inset-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around py-1.5">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-all",
                isActive
                  ? "text-[#FF7A00]"
                  : "text-[#A1A1A1]"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                isActive && "bg-[#FF7A00]/10"
              )}>
                <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_rgba(255,122,0,0.5)]")} />
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-white/[0.03] p-1">
      {bottomNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-[#FF7A00]/10 text-[#FF7A00]"
                : "text-[#A1A1A1] hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
