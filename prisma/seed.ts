import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Ascendly database...");

  // ── Achievements ───────────────────────────────────────────────────────────
  const achievements = [
    {
      title: "First Habit",
      description: "Complete your first habit",
      type: "FIRST_HABIT" as const,
      target: 1,
      xpReward: 50,
      coinReward: 25,
      icon: "target",
    },
    {
      title: "7 Day Streak",
      description: "Maintain a 7-day streak",
      type: "STREAK_7" as const,
      target: 7,
      xpReward: 100,
      coinReward: 50,
      icon: "flame",
    },
    {
      title: "30 Day Streak",
      description: "Maintain a 30-day streak",
      type: "STREAK_30" as const,
      target: 30,
      xpReward: 500,
      coinReward: 250,
      icon: "zap",
    },
    {
      title: "Level 10",
      description: "Reach level 10",
      type: "LEVEL_10" as const,
      target: 10,
      xpReward: 300,
      coinReward: 150,
      icon: "star",
    },
    {
      title: "Top 10 Ranking",
      description: "Enter the top 10 weekly ranking",
      type: "TOP_10_RANKING" as const,
      target: 10,
      xpReward: 200,
      coinReward: 100,
      icon: "crown",
    },
    {
      title: "100 Habits Completed",
      description: "Complete 100 habits total",
      type: "HABITS_COMPLETED" as const,
      target: 100,
      xpReward: 500,
      coinReward: 250,
      icon: "trophy",
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: {
        id: `seed-${achievement.type}`,
      },
      update: {
        title: achievement.title,
        description: achievement.description,
        target: achievement.target,
        xpReward: achievement.xpReward,
        coinReward: achievement.coinReward,
        icon: achievement.icon,
      },
      create: {
        id: `seed-${achievement.type}`,
        ...achievement,
      },
    });
    console.log(`  ✓ Achievement: ${achievement.title}`);
  }

  // ── Missions ───────────────────────────────────────────────────────────────
  const missions = [
    {
      title: "Complete 3 Habits",
      description: "Complete 3 habits today",
      type: "COMPLETE_HABITS" as const,
      target: 3,
      xpReward: 50,
      coinReward: 25,
    },
    {
      title: "Earn 100 XP",
      description: "Earn 100 XP today",
      type: "EARN_XP" as const,
      target: 100,
      xpReward: 30,
      coinReward: 15,
    },
    {
      title: "Maintain Streak",
      description: "Complete at least 1 habit today to keep your streak",
      type: "MAINTAIN_STREAK" as const,
      target: 1,
      xpReward: 25,
      coinReward: 10,
    },
  ];

  for (const mission of missions) {
    await prisma.mission.upsert({
      where: {
        id: `seed-${mission.type}`,
      },
      update: {
        title: mission.title,
        description: mission.description,
        target: mission.target,
        xpReward: mission.xpReward,
        coinReward: mission.coinReward,
      },
      create: {
        id: `seed-${mission.type}`,
        ...mission,
      },
    });
    console.log(`  ✓ Mission: ${mission.title}`);
  }

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
