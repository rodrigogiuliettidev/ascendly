"use client";

import { Sparkles, TrendingUp, TrendingDown, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface XpBalanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gained: number;
  lost: number;
  net: number;
  total: number;
}

export function XpBalanceModal({
  open,
  onOpenChange,
  gained,
  lost,
  net,
  total,
}: XpBalanceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#FF7A00]" />
            XP Balance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Today's stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[#10B981]" />
                <span className="text-xs text-[#A1A1A1]">Gained Today</span>
              </div>
              <span className="text-xl font-bold text-[#10B981]">
                +{gained}
              </span>
            </div>

            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-xs text-[#A1A1A1]">Lost Today</span>
              </div>
              <span className="text-xl font-bold text-red-400">-{lost}</span>
            </div>
          </div>

          {/* Net XP */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#FF9F3F]" />
                <span className="text-sm text-[#A1A1A1]">Net XP Today</span>
              </div>
              <span
                className={cn(
                  "text-xl font-bold",
                  net >= 0 ? "text-[#10B981]" : "text-red-400",
                )}
              >
                {net >= 0 ? "+" : ""}
                {net}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06]" />

          {/* Total XP */}
          <div className="rounded-xl bg-gradient-to-br from-[#FF7A00]/10 to-[#FF9F3F]/10 border border-[#FF7A00]/20 p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-[#FF7A00]" />
              <span className="text-sm text-[#A1A1A1]">Total XP</span>
            </div>
            <span className="text-3xl font-bold text-white">
              {total.toLocaleString()}
            </span>
          </div>

          {/* Info */}
          <p className="text-[11px] text-[#A1A1A1] text-center">
            Complete habits to earn XP. Missing scheduled habits results in
            penalties.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
