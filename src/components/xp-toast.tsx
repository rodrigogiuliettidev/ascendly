"use client";

import { useState, useEffect } from "react";

interface XpToastProps {
  xp: number;
  coins?: number;
  show: boolean;
  onComplete?: () => void;
}

export function XpToast({ xp, coins, show, onComplete }: XpToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-xp-pop flex flex-col items-center gap-1">
        <span className="text-4xl font-bold text-[#FF7A00] drop-shadow-[0_0_20px_rgba(255,122,0,0.8)]">
          +{xp} XP
        </span>
        {coins && coins > 0 && (
          <span className="text-xl font-semibold text-[#EAB308] drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]">
            +{coins} 🪙
          </span>
        )}
      </div>
    </div>
  );
}

// Inline XP indicator that floats up from a specific element
interface XpFloatProps {
  xp: number;
  show: boolean;
}

export function XpFloat({ xp, show }: XpFloatProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <span className="absolute -top-2 right-0 animate-xp-float text-sm font-bold text-[#FF7A00] pointer-events-none">
      +{xp}
    </span>
  );
}
