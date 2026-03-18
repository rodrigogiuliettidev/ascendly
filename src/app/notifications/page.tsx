"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Flame,
  Trophy,
  Target,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useApi } from "@/hooks/use-api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotificationData {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  link: string | null;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  ACHIEVEMENT_UNLOCK: { icon: Trophy, color: "#FFD700" },
  MISSION_COMPLETE: { icon: Target, color: "#10B981" },
  RANKING_UPDATE: { icon: Sparkles, color: "#FF7A00" },
  STREAK_WARNING: { icon: Flame, color: "#FF7A00" },
  HABIT_REMINDER: { icon: Clock, color: "#A1A1A1" },
  XP_REWARD: { icon: Sparkles, color: "#FF9F3F" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { get, patch } = useApi();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchNotifications() {
      setLoading(true);
      try {
        const data = await get<NotificationData[]>("/api/notifications");
        setNotifications(data);
      } catch (err) {
        console.error("Fetch notifications error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [user, get]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await patch("/api/notifications");
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF7A00]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#FF7A00]" />
            Notifications
          </h1>
          <p className="text-sm text-[#A1A1A1]">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            className="text-[#FF7A00] hover:text-[#FF9F3F]"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {notifications.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#121212] p-12 text-center">
            <p className="text-[#A1A1A1] text-sm">No notifications yet.</p>
          </div>
        )}
        {notifications.map((notification, i) => {
          const config = typeConfig[notification.type] || {
            icon: Bell,
            color: "#A1A1A1",
          };
          const Icon = config.icon;
          const handleClick = () => {
            if (notification.link) {
              router.push(notification.link);
            }
          };
          return (
            <div
              key={notification.id}
              onClick={handleClick}
              role={notification.link ? "button" : undefined}
              tabIndex={notification.link ? 0 : undefined}
              className={cn(
                "w-full flex items-start gap-4 rounded-2xl border p-4 text-left transition-all animate-slide-up",
                notification.read
                  ? "border-white/[0.04] bg-[#121212]/60"
                  : "border-white/[0.06] bg-[#121212]",
                notification.link && "cursor-pointer hover:border-white/10",
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  notification.read ? "opacity-50" : "",
                )}
                style={{ backgroundColor: `${config.color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: config.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    notification.read
                      ? "text-[#A1A1A1]"
                      : "text-white font-medium",
                  )}
                >
                  {notification.message}
                </p>
                <p className="text-[11px] text-[#A1A1A1] mt-1">
                  {timeAgo(notification.createdAt)}
                </p>
              </div>

              {/* Unread dot */}
              {!notification.read && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#FF7A00] shadow-lg shadow-[#FF7A00]/30" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
