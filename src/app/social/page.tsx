"use client";

import { useState } from "react";
import { Search, UserPlus, UserCheck, Users, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_USERS = [
  {
    id: "u1",
    name: "Sarah K.",
    initials: "SK",
    level: 8,
    xp: 2850,
    isFollowing: true,
  },
  {
    id: "u2",
    name: "Alex M.",
    initials: "AM",
    level: 7,
    xp: 2340,
    isFollowing: false,
  },
  {
    id: "u3",
    name: "Jordan L.",
    initials: "JL",
    level: 6,
    xp: 1980,
    isFollowing: true,
  },
  {
    id: "u4",
    name: "Taylor R.",
    initials: "TR",
    level: 3,
    xp: 1100,
    isFollowing: false,
  },
  {
    id: "u5",
    name: "Morgan P.",
    initials: "MP",
    level: 3,
    xp: 980,
    isFollowing: false,
  },
  {
    id: "u6",
    name: "Casey W.",
    initials: "CW",
    level: 2,
    xp: 870,
    isFollowing: true,
  },
];

const MOCK_FOLLOWERS = [
  {
    id: "u1",
    name: "Sarah K.",
    initials: "SK",
    level: 8,
    xp: 2850,
    isFollowing: true,
  },
  {
    id: "u3",
    name: "Jordan L.",
    initials: "JL",
    level: 6,
    xp: 1980,
    isFollowing: true,
  },
  {
    id: "u7",
    name: "Jamie T.",
    initials: "JT",
    level: 4,
    xp: 1400,
    isFollowing: false,
  },
];

type UserData = (typeof MOCK_USERS)[number];

export default function SocialPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(MOCK_USERS);
  const [followers, setFollowers] = useState(MOCK_FOLLOWERS);

  const toggleFollow = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, isFollowing: !u.isFollowing } : u,
      ),
    );
    setFollowers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, isFollowing: !u.isFollowing } : u,
      ),
    );
  };

  const following = users.filter((u) => u.isFollowing);
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-[#FF7A00]" />
          Social
        </h1>
        <p className="text-sm text-[#A1A1A1]">
          Connect with other users and compete together
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1A1]" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="discover">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="following">
            Following ({following.length})
          </TabsTrigger>
          <TabsTrigger value="followers">
            Followers ({followers.length})
          </TabsTrigger>
        </TabsList>

        {/* Discover */}
        <TabsContent value="discover">
          <div className="space-y-2">
            {filteredUsers.map((user, i) => (
              <UserCard
                key={user.id}
                user={user}
                onToggleFollow={() => toggleFollow(user.id)}
                delay={i * 50}
              />
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-[#A1A1A1]">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No users found</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Following */}
        <TabsContent value="following">
          <div className="space-y-2">
            {following.length === 0 ? (
              <div className="text-center py-12 text-[#A1A1A1]">
                <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">You&apos;re not following anyone yet</p>
              </div>
            ) : (
              following.map((user, i) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onToggleFollow={() => toggleFollow(user.id)}
                  delay={i * 50}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Followers */}
        <TabsContent value="followers">
          <div className="space-y-2">
            {followers.map((user, i) => (
              <UserCard
                key={user.id}
                user={user}
                onToggleFollow={() => toggleFollow(user.id)}
                delay={i * 50}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserCard({
  user,
  onToggleFollow,
  delay = 0,
}: {
  user: UserData;
  onToggleFollow: () => void;
  delay?: number;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#121212] p-4 transition-all hover:border-white/10 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Avatar
        className={cn(
          "h-12 w-12",
          user.isFollowing && "ring-2 ring-[#FF7A00]/30",
        )}
      >
        <AvatarFallback>{user.initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{user.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-[#A1A1A1]">Level {user.level}</span>
          <span className="flex items-center gap-1 text-xs text-[#FF7A00]">
            <Sparkles className="h-3 w-3" />
            {user.xp.toLocaleString()} XP
          </span>
        </div>
      </div>

      <Button
        variant={user.isFollowing ? "outline" : "default"}
        size="sm"
        onClick={onToggleFollow}
        className={cn(
          "gap-1.5 shrink-0",
          user.isFollowing &&
            "text-[#A1A1A1] hover:text-red-400 hover:border-red-400/30",
        )}
      >
        {user.isFollowing ? (
          <>
            <UserCheck className="h-3.5 w-3.5" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="h-3.5 w-3.5" />
            Follow
          </>
        )}
      </Button>
    </div>
  );
}
