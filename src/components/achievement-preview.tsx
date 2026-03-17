"use client";

import {
  Trophy,
  Flame,
  Star,
  Target,
  Crown,
  Zap,
  Award,
  Shield,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface AchievementPreviewProps {
  achievements: Achievement[];
}

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  flame: Flame,
  star: Star,
  target: Target,
  crown: Crown,
  zap: Zap,
  award: Award,
  shield: Shield,
  sparkles: Sparkles,
};

export function AchievementPreview({ achievements }: AchievementPreviewProps) {
  const recent = achievements.slice(0, 4);

  return (
    <Card className="bg-[#121212] border-[#1E1E1E]">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#FF7A00]" />
          Achievements
          <span className="text-xs text-[#A1A1A1] font-normal ml-auto">
            {achievements.filter((a) => a.unlocked).length}/
            {achievements.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {recent.map((achievement) => {
            const Icon = iconMap[achievement.icon] || Star;
            return (
              <div
                key={achievement.id}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                  achievement.unlocked
                    ? "bg-[#FF7A00]/10 border border-[#FF7A00]/20"
                    : "bg-[#1A1A1A] border border-[#2A2A2A] opacity-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.unlocked
                      ? "bg-[#FF7A00]/20 shadow-[0_0_15px_rgba(255,122,0,0.3)]"
                      : "bg-[#2A2A2A]"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      achievement.unlocked ? "text-[#FF7A00]" : "text-[#555]"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] text-center leading-tight ${
                    achievement.unlocked ? "text-white" : "text-[#555]"
                  }`}
                >
                  {achievement.title}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
