"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Sparkles,
  Coins,
  Check,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useApi } from "@/hooks/use-api";
import { XpToast } from "@/components/xp-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HabitData {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  coinReward: number;
  reminderTime: number | null;
  daysOfWeek: number[];
  completedToday: boolean;
}

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HabitsPage() {
  const { user } = useAuth();
  const { get, post, del } = useApi();

  const [habits, setHabits] = useState<HabitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitData | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    xpReward: "25",
    coinReward: "10",
    reminderTime: "",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6] as number[],
  });
  const [saving, setSaving] = useState(false);
  const [xpToast, setXpToast] = useState<{
    xp: number;
    coins: number;
    show: boolean;
  }>({ xp: 0, coins: 0, show: false });

  // Fetch habits
  useEffect(() => {
    if (!user) return;

    async function fetchHabits() {
      setLoading(true);
      try {
        const data = await get<HabitData[]>("/api/habits");
        setHabits(data);
      } catch (err) {
        console.error("Fetch habits error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHabits();
  }, [user, get]);

  const completedCount = habits.filter((h) => h.completedToday).length;

  const handleComplete = async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit || habit.completedToday) return;

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completedToday: true } : h)),
    );

    try {
      await post(`/api/habits/${id}/complete`);
      setXpToast({ xp: habit.xpReward, coins: habit.coinReward, show: true });
    } catch (err) {
      // Revert
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, completedToday: false } : h)),
      );
      console.error("Complete habit error:", err);
    }
  };

  const openCreateDialog = () => {
    setEditingHabit(null);
    setForm({
      title: "",
      description: "",
      xpReward: "25",
      coinReward: "10",
      reminderTime: "",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (habit: HabitData) => {
    setEditingHabit(habit);
    setForm({
      title: habit.title,
      description: habit.description || "",
      xpReward: String(habit.xpReward),
      coinReward: String(habit.coinReward),
      reminderTime:
        habit.reminderTime != null
          ? `${String(Math.floor(habit.reminderTime / 60)).padStart(2, "0")}:${String(habit.reminderTime % 60).padStart(2, "0")}`
          : "",
      daysOfWeek: habit.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    });
    setDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (form.daysOfWeek.length === 0) return;
    setSaving(true);

    // Convert HH:MM to minutes
    let reminderMinutes: string | undefined;
    if (form.reminderTime) {
      const [h, m] = form.reminderTime.split(":").map(Number);
      reminderMinutes = String(h * 60 + m);
    }

    try {
      if (editingHabit) {
        // For now, just update locally (edit API can be added later)
        setHabits((prev) =>
          prev.map((h) =>
            h.id === editingHabit.id
              ? {
                  ...h,
                  title: form.title,
                  description: form.description,
                  xpReward: Number(form.xpReward) || 25,
                  coinReward: Number(form.coinReward) || 10,
                  reminderTime: reminderMinutes
                    ? Number(reminderMinutes)
                    : null,
                  daysOfWeek: form.daysOfWeek,
                }
              : h,
          ),
        );
      } else {
        const newHabit = await post<HabitData>("/api/habits", {
          title: form.title,
          description: form.description || undefined,
          xpReward: Number(form.xpReward) || 25,
          coinReward: Number(form.coinReward) || 10,
          reminderTime: reminderMinutes,
          daysOfWeek: form.daysOfWeek,
        });
        setHabits((prev) => [
          ...prev,
          { ...newHabit, completedToday: false, daysOfWeek: form.daysOfWeek },
        ]);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error("Save habit error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = habits;
    setHabits((prev) => prev.filter((h) => h.id !== id));

    try {
      await del(`/api/habits/${id}`);
    } catch (err) {
      setHabits(previous);
      console.error("Delete habit error:", err);
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
          <h1 className="text-xl font-bold text-white">My Habits</h1>
          <p className="text-sm text-[#A1A1A1]">
            {completedCount} of {habits.length} completed today
          </p>
        </div>
        {/* Desktop add button */}
        <Button onClick={openCreateDialog} className="hidden sm:flex gap-2">
          <Plus className="h-4 w-4" />
          New Habit
        </Button>
      </div>

      {/* Today's progress */}
      {habits.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#121212] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              Today&apos;s Progress
            </span>
            <span className="text-sm font-bold text-[#FF7A00]">
              {Math.round((completedCount / habits.length) * 100)}%
            </span>
          </div>
          <Progress
            value={(completedCount / habits.length) * 100}
            className="h-3"
            indicatorClassName="bg-gradient-to-r from-[#FF7A00] to-[#FF9F3F]"
          />
        </div>
      )}

      {/* Habit List */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-[#121212] p-12 text-center">
            <p className="text-[#A1A1A1] text-sm mb-4">
              No habits yet. Create your first one!
            </p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Habit
            </Button>
          </div>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              className={cn(
                "group rounded-2xl border border-white/[0.06] bg-[#121212] p-4 transition-all duration-200 animate-slide-up",
                habit.completedToday
                  ? "border-[#FF7A00]/20 bg-[#FF7A00]/[0.04]"
                  : "hover:border-white/10",
              )}
            >
              <div className="flex items-center gap-4">
                {/* Completion toggle */}
                <button
                  onClick={() =>
                    !habit.completedToday && handleComplete(habit.id)
                  }
                  disabled={habit.completedToday}
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-300",
                    habit.completedToday
                      ? "border-[#FF7A00] bg-[#FF7A00] text-white shadow-lg shadow-[#FF7A00]/25"
                      : "border-white/15 text-transparent hover:border-[#FF7A00]/50 hover:text-[#FF7A00]/50 active:scale-90",
                  )}
                >
                  <Check className="h-6 w-6" strokeWidth={3} />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-semibold",
                      habit.completedToday
                        ? "text-[#A1A1A1] line-through"
                        : "text-white",
                    )}
                  >
                    {habit.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {habit.description && (
                      <p className="text-sm text-[#A1A1A1] truncate">
                        {habit.description}
                      </p>
                    )}
                    {habit.daysOfWeek && habit.daysOfWeek.length < 7 && (
                      <div className="flex gap-0.5">
                        {WEEKDAYS.map((day) => (
                          <span
                            key={day.value}
                            className={cn(
                              "text-[9px] font-bold w-4 text-center",
                              habit.daysOfWeek.includes(day.value)
                                ? "text-[#FF7A00]"
                                : "text-[#333333]",
                            )}
                          >
                            {day.label[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rewards + Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg bg-[#FF7A00]/10 px-2 py-1">
                      <Sparkles className="h-3 w-3 text-[#FF7A00]" />
                      <span className="text-xs font-semibold text-[#FF7A00]">
                        {habit.xpReward}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-[#EAB308]/10 px-2 py-1">
                      <Coins className="h-3 w-3 text-[#EAB308]" />
                      <span className="text-xs font-semibold text-[#EAB308]">
                        {habit.coinReward}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      onClick={() => openEditDialog(habit)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-[#A1A1A1] hover:text-white transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#A1A1A1] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Add Button (mobile) */}
      <button
        onClick={openCreateDialog}
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#FF9F3F] text-white shadow-xl shadow-[#FF7A00]/30 transition-transform hover:scale-105 active:scale-95 sm:hidden"
        style={{
          bottom:
            "calc(var(--mobile-nav-height) + env(safe-area-inset-bottom) + 0.5rem)",
        }}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHabit ? "Edit Habit" : "New Habit"}
            </DialogTitle>
            <DialogDescription>
              {editingHabit
                ? "Update your habit details."
                : "Create a new habit to track daily."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A1A1A1]">
                Title
              </label>
              <Input
                placeholder="e.g. Morning workout"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A1A1A1]">
                Description
              </label>
              <Input
                placeholder="e.g. 30 minutes of exercise"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#A1A1A1] flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#FF7A00]" /> XP Reward
                </label>
                <Input
                  type="number"
                  value={form.xpReward}
                  onChange={(e) =>
                    setForm({ ...form, xpReward: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#A1A1A1] flex items-center gap-1">
                  <Coins className="h-3 w-3 text-[#EAB308]" /> Coin Reward
                </label>
                <Input
                  type="number"
                  value={form.coinReward}
                  onChange={(e) =>
                    setForm({ ...form, coinReward: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A1A1A1] flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#A1A1A1]" /> Reminder Time
              </label>
              <Input
                type="time"
                value={form.reminderTime}
                onChange={(e) =>
                  setForm({ ...form, reminderTime: e.target.value })
                }
                placeholder="e.g. 18:30"
                className="[color-scheme:dark]"
              />
              <p className="text-[10px] text-[#A1A1A1]">
                Leave empty for no reminder
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A1A1A1] flex items-center gap-1">
                <CalendarDays className="h-3 w-3 text-[#A1A1A1]" /> Schedule
              </label>
              <div className="flex gap-1.5">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                      form.daysOfWeek.includes(day.value)
                        ? "bg-[#FF7A00] text-white shadow-lg shadow-[#FF7A00]/20"
                        : "bg-white/5 text-[#666666] hover:bg-white/10 hover:text-[#A1A1A1]",
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#A1A1A1]">
                Select the days this habit should be active
              </p>
            </div>
            <Button
              onClick={handleSave}
              className="w-full"
              size="lg"
              disabled={saving || form.daysOfWeek.length === 0}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingHabit ? "Save Changes" : "Create Habit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* XP Toast */}
      <XpToast
        xp={xpToast.xp}
        coins={xpToast.coins}
        show={xpToast.show}
        onComplete={() => setXpToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
