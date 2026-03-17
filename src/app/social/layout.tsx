"use client";

import { TopBar, MobileNav } from "@/components/navigation";

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 lg:px-8 lg:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
