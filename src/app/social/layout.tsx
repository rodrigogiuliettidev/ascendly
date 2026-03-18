"use client";

import { TopBar, MobileNav } from "@/components/navigation";

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0B0B0B]">
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 pt-6 max-[380px]:px-3 pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom)+1rem)] max-[380px]:pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom)+1.5rem)] lg:px-8 lg:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
