"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer.slice(
    outputArray.byteOffset,
    outputArray.byteOffset + outputArray.byteLength,
  );
}

export function NotificationPrompt() {
  const { post } = useApi();
  const [visible, setVisible] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    // Only show if browser supports notifications and user hasn't decided yet
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission !== "default") return;
    if (!VAPID_PUBLIC_KEY) return;

    // Show after a short delay
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setRegistering(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setVisible(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
      });

      await post("/api/users/register-token", {
        subscription: subscription.toJSON(),
      });
      console.log("[NotificationPrompt] Push subscription registered");
      setVisible(false);
    } catch (error) {
      console.error(
        "[NotificationPrompt] Failed to enable notifications:",
        error,
      );
    } finally {
      setRegistering(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed left-4 right-4 z-[60] mx-auto max-w-md animate-slide-up sm:bottom-8"
      style={{
        bottom:
          "calc(var(--mobile-nav-height) + env(safe-area-inset-bottom) + 0.75rem)",
      }}
    >
      <div className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF7A00]/15">
            <Bell className="h-5 w-5 text-[#FF7A00]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              Enable Notifications
            </p>
            <p className="text-xs text-[#A1A1A1] mt-0.5">
              Receive habit reminders, achievements, and ranking updates.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleEnable}
                disabled={registering}
                className="text-xs"
              >
                {registering ? "Enabling..." : "Enable"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setVisible(false)}
                className="text-xs text-[#A1A1A1]"
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="shrink-0 p-1 rounded-lg hover:bg-white/5 text-[#A1A1A1] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
