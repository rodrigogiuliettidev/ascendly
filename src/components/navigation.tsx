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
    <nav className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
      <div className="mx-auto max-w-md">
        {/* Outer glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#FF7A00]/20 via-transparent to-[#FF7A00]/20 blur-xl opacity-50" />
        
        {/* Main container */}
        <div className="relative rounded-3xl border border-white/[0.08] bg-[#0D0D0D]/95 backdrop-blur-2xl shadow-2xl shadow-black/50">
          {/* Top highlight */}
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="flex items-center justify-around px-2 py-3">
            {bottomNavItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center gap-1 px-4 py-1.5 transition-all duration-300 active:scale-95",
                    isActive ? "text-[#FF7A00]" : "text-[#555555]",
                  )}
                >
                  {/* Active background glow */}
                  {isActive && (
                    <>
                      <div className="absolute inset-0 rounded-2xl bg-[#FF7A00]/10" />
                      <div className="absolute inset-0 rounded-2xl bg-[#FF7A00]/5 blur-md" />
                    </>
                  )}
                  
                  {/* Icon container */}
                  <div
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300",
                      isActive 
                        ? "bg-gradient-to-br from-[#FF7A00]/20 to-[#FF7A00]/5" 
                        : "hover:bg-white/5",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive && "scale-110 drop-shadow-[0_0_12px_rgba(255,122,0,0.8)]",
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    
                    {/* Active dot indicator with glow */}
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-[#FF7A00] shadow-[0_0_8px_3px_rgba(255,122,0,0.6)]" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span 
                    className={cn(
                      "relative text-[10px] font-semibold transition-all duration-300",
                      isActive ? "opacity-100" : "opacity-70"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex items-center gap-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-1.5">
      {bottomNavItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
              isActive
                ? "text-[#FF7A00]"
                : "text-[#A1A1A1] hover:text-white hover:bg-white/5",
            )}
          >
            {isActive && (
              <>
                <div className="absolute inset-0 rounded-xl bg-[#FF7A00]/10" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF7A00]/5 to-transparent" />
              </>
            )}
            <item.icon 
              className={cn(
                "relative h-4 w-4 transition-all",
                isActive && "drop-shadow-[0_0_8px_rgba(255,122,0,0.6)]"
              )} 
            />
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
