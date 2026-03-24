"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  UserPlus,
  UserCheck,
  Users,
  Sparkles,
  Clock,
  Check,
  X,
  Swords,
  Trophy,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";

interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  status: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIENDS";
}

interface Friend {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
}

interface PendingRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderXp: number;
  senderLevel: number;
  createdAt: string;
}

interface UserChallenge {
  id: string;
  title: string;
  description?: string;
  targetCount: number;
  durationDays: number;
  status: "PENDING" | "ACTIVE" | "REJECTED" | "COMPLETED";
  isSender: boolean;
  opponent: { id: string; name: string };
  myProgress: number;
  opponentProgress: number;
  myCompleted: boolean;
  opponentCompleted: boolean;
  daysRemaining: number;
  winnerId?: string;
  createdAt: string;
}

interface PendingChallenge {
  id: string;
  title: string;
  description?: string;
  targetCount: number;
  durationDays: number;
  sender: { id: string; name: string };
  createdAt: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SocialPage() {
  const { get, post, authFetch } = useApi();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [pendingChallenges, setPendingChallenges] = useState<
    PendingChallenge[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("friends");

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    try {
      const data = await get<Friend[]>("/api/social/friends");
      setFriends(data);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  }, [get]);

  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    try {
      const data = await get<PendingRequest[]>("/api/social/requests");
      setPendingRequests(data);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    }
  }, [get]);

  // Fetch challenges
  const fetchChallenges = useCallback(async () => {
    try {
      const [allData, pendingData] = await Promise.all([
        get<UserChallenge[]>("/api/user-challenges"),
        get<PendingChallenge[]>("/api/user-challenges?pending=true"),
      ]);
      setChallenges(allData);
      setPendingChallenges(pendingData);
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
    }
  }, [get]);

  // Initial load
  useEffect(() => {
    Promise.all([
      fetchFriends(),
      fetchPendingRequests(),
      fetchChallenges(),
    ]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchFriends, fetchPendingRequests, fetchChallenges]);

  // Search users with debounce
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await authFetch(
          `/api/users/search?q=${encodeURIComponent(search)}`,
        );
        if (res.ok) {
          const data = await res.json();
          console.log("[Social] Search results:", data);
          setSearchResults(data);
        } else {
          console.error("[Social] Search failed:", res.status);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, authFetch]);

  // Send follow request
  const handleSendRequest = async (receiverId: string) => {
    try {
      await post("/api/social/request", { receiverId });
      // Update search results
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === receiverId ? { ...u, status: "PENDING_SENT" as const } : u,
        ),
      );
    } catch (error) {
      console.error("Failed to send request:", error);
    }
  };

  // Accept follow request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await post("/api/social/request/accept", { requestId });
      await fetchFriends();
      await fetchPendingRequests();
    } catch (error) {
      console.error("Failed to accept request:", error);
    }
  };

  // Reject follow request
  const handleRejectRequest = async (requestId: string) => {
    try {
      await post("/api/social/request/reject", { requestId });
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error("Failed to reject request:", error);
    }
  };

  // Accept challenge
  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await post("/api/user-challenges/accept", { challengeId });
      await fetchChallenges();
    } catch (error) {
      console.error("Failed to accept challenge:", error);
    }
  };

  // Reject challenge
  const handleRejectChallenge = async (challengeId: string) => {
    try {
      await post("/api/user-challenges/reject", { challengeId });
      setPendingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
    } catch (error) {
      console.error("Failed to reject challenge:", error);
    }
  };

  const activeChallenges = challenges.filter((c) => c.status === "ACTIVE");
  const completedChallenges = challenges.filter(
    (c) => c.status === "COMPLETED",
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF7A00]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-[#FF7A00]" />
          Social
        </h1>
        <p className="text-sm text-[#A1A1A1]">
          Connect with friends and compete in challenges
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1A1]" />
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#A1A1A1]" />
        )}
      </div>

      {/* Search Results */}
      {search.length >= 2 && (
        <div className="space-y-2">
          <p className="text-xs text-[#A1A1A1] uppercase tracking-wider">
            Search Results
          </p>
          {searchResults.length === 0 && !isSearching ? (
            <div className="text-center py-8 text-[#A1A1A1]">
              <Search className="h-6 w-6 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            searchResults.map((user) => (
              <SearchResultCard
                key={user.id}
                user={user}
                onSendRequest={() => handleSendRequest(user.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Tabs (when not searching) */}
      {search.length < 2 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="challenges">
              Challenges ({activeChallenges.length})
            </TabsTrigger>
          </TabsList>

          {/* Friends Tab */}
          <TabsContent value="friends">
            <div className="space-y-2">
              {friends.length === 0 ? (
                <div className="text-center py-12 text-[#A1A1A1]">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No friends yet</p>
                  <p className="text-xs mt-1">
                    Search for users to send friend requests
                  </p>
                </div>
              ) : (
                friends.map((friend, i) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    onChallenge={() => setActiveTab("challenges")}
                    onRefresh={fetchChallenges}
                    post={post}
                    delay={i * 50}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <div className="space-y-4">
              {/* Pending Challenges */}
              {pendingChallenges.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[#A1A1A1] uppercase tracking-wider">
                    Challenge Requests
                  </p>
                  {pendingChallenges.map((challenge) => (
                    <PendingChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onAccept={() => handleAcceptChallenge(challenge.id)}
                      onReject={() => handleRejectChallenge(challenge.id)}
                    />
                  ))}
                </div>
              )}

              {/* Friend Requests */}
              <div className="space-y-2">
                {pendingChallenges.length > 0 && pendingRequests.length > 0 && (
                  <p className="text-xs text-[#A1A1A1] uppercase tracking-wider">
                    Friend Requests
                  </p>
                )}
                {pendingRequests.length === 0 &&
                pendingChallenges.length === 0 ? (
                  <div className="text-center py-12 text-[#A1A1A1]">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No pending requests</p>
                  </div>
                ) : (
                  pendingRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onAccept={() => handleAcceptRequest(request.id)}
                      onReject={() => handleRejectRequest(request.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <div className="space-y-4">
              {/* Active Challenges */}
              {activeChallenges.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[#A1A1A1] uppercase tracking-wider">
                    Active Challenges
                  </p>
                  {activeChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              )}

              {/* Completed Challenges */}
              {completedChallenges.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[#A1A1A1] uppercase tracking-wider">
                    Completed
                  </p>
                  {completedChallenges.slice(0, 5).map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              )}

              {activeChallenges.length === 0 &&
                completedChallenges.length === 0 && (
                  <div className="text-center py-12 text-[#A1A1A1]">
                    <Swords className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No challenges yet</p>
                    <p className="text-xs mt-1">
                      Challenge a friend to compete!
                    </p>
                  </div>
                )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Search result card
function SearchResultCard({
  user,
  onSendRequest,
}: {
  user: User;
  onSendRequest: () => void;
}) {
  const getButtonContent = () => {
    switch (user.status) {
      case "FRIENDS":
        return (
          <Button variant="outline" size="sm" disabled className="gap-1.5">
            <UserCheck className="h-3.5 w-3.5" />
            Friends
          </Button>
        );
      case "PENDING_SENT":
        return (
          <Button variant="outline" size="sm" disabled className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </Button>
        );
      case "PENDING_RECEIVED":
        return (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="gap-1.5 text-[#FF7A00]"
          >
            <Clock className="h-3.5 w-3.5" />
            Respond
          </Button>
        );
      default:
        return (
          <Button size="sm" onClick={onSendRequest} className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Follow
          </Button>
        );
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#121212] p-4">
      <Avatar className="h-12 w-12">
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
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

      {getButtonContent()}
    </div>
  );
}

// Friend card
function FriendCard({
  friend,
  onChallenge,
  onRefresh,
  post,
  delay = 0,
}: {
  friend: Friend;
  onChallenge: () => void;
  onRefresh: () => void;
  post: <T = unknown>(url: string, body?: unknown) => Promise<T>;
  delay?: number;
}) {
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState("Complete 20 habits");
  const [targetCount, setTargetCount] = useState(20);
  const [durationDays, setDurationDays] = useState(7);
  const [isSending, setIsSending] = useState(false);

  const handleSendChallenge = async () => {
    setIsSending(true);
    try {
      await post("/api/user-challenges", {
        receiverId: friend.id,
        title: challengeTitle,
        targetCount,
        durationDays,
      });
      setShowChallengeDialog(false);
      onRefresh();
      onChallenge();
    } catch (error) {
      console.error("Failed to send challenge:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#121212] p-4 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Avatar className="h-12 w-12 ring-2 ring-[#FF7A00]/30">
        <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{friend.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-[#A1A1A1]">Level {friend.level}</span>
          <span className="flex items-center gap-1 text-xs text-[#FF7A00]">
            <Sparkles className="h-3 w-3" />
            {friend.xp.toLocaleString()} XP
          </span>
          {friend.streak > 0 && (
            <span className="text-xs text-orange-400">🔥 {friend.streak}</span>
          )}
        </div>
      </div>

      <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Swords className="h-3.5 w-3.5" />
            Challenge
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Challenge {friend.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-[#A1A1A1]">Challenge Title</label>
              <Input
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                placeholder="e.g., Complete 20 habits"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A1A1A1]">
                  Target (habits)
                </label>
                <Input
                  type="number"
                  value={targetCount}
                  onChange={(e) =>
                    setTargetCount(parseInt(e.target.value) || 20)
                  }
                  min={1}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-[#A1A1A1]">
                  Duration (days)
                </label>
                <Input
                  type="number"
                  value={durationDays}
                  onChange={(e) =>
                    setDurationDays(parseInt(e.target.value) || 7)
                  }
                  min={1}
                  max={30}
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              onClick={handleSendChallenge}
              disabled={isSending || !challengeTitle}
              className="w-full"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Swords className="h-4 w-4 mr-2" />
                  Send Challenge
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Pending request card
function RequestCard({
  request,
  onAccept,
  onReject,
}: {
  request: PendingRequest;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#121212] p-4">
      <Avatar className="h-12 w-12">
        <AvatarFallback>{getInitials(request.senderName)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">
          {request.senderName}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-[#A1A1A1]">
            Level {request.senderLevel}
          </span>
          <span className="flex items-center gap-1 text-xs text-[#FF7A00]">
            <Sparkles className="h-3 w-3" />
            {request.senderXp.toLocaleString()} XP
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={onReject}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={onAccept} className="h-8 w-8">
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Pending challenge card
function PendingChallengeCard({
  challenge,
  onAccept,
  onReject,
}: {
  challenge: PendingChallenge;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#FF7A00]/20 bg-[#121212] p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-[#FF7A00]" />
            <p className="font-semibold text-white">{challenge.title}</p>
          </div>
          <p className="text-sm text-[#A1A1A1] mt-1">
            From {challenge.sender.name}
          </p>
          <p className="text-xs text-[#A1A1A1] mt-2">
            {challenge.targetCount} habits • {challenge.durationDays} days
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={onReject}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={onAccept} className="h-8 w-8">
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Challenge card
function ChallengeCard({ challenge }: { challenge: UserChallenge }) {
  const progressPercent = Math.min(
    100,
    Math.round((challenge.myProgress / challenge.targetCount) * 100),
  );
  const opponentPercent = Math.min(
    100,
    Math.round((challenge.opponentProgress / challenge.targetCount) * 100),
  );

  const isCompleted = challenge.status === "COMPLETED";
  const isWinner =
    challenge.winnerId && challenge.winnerId !== challenge.opponent.id;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-[#121212] p-4",
        isCompleted
          ? isWinner
            ? "border-green-500/30"
            : "border-white/[0.06]"
          : "border-[#FF7A00]/20",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <Trophy
              className={cn(
                "h-4 w-4",
                isWinner ? "text-yellow-400" : "text-[#A1A1A1]",
              )}
            />
          ) : (
            <Swords className="h-4 w-4 text-[#FF7A00]" />
          )}
          <p className="font-semibold text-white">{challenge.title}</p>
        </div>
        {!isCompleted && (
          <span className="text-xs text-[#A1A1A1]">
            {challenge.daysRemaining}d left
          </span>
        )}
        {isCompleted && (
          <span
            className={cn(
              "text-xs",
              isWinner ? "text-green-400" : "text-[#A1A1A1]",
            )}
          >
            {isWinner ? "Won!" : "Lost"}
          </span>
        )}
      </div>

      {/* Your progress */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white">You</span>
          <span className="text-[#A1A1A1]">
            {challenge.myProgress}/{challenge.targetCount}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#FF7A00] rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Opponent progress */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#A1A1A1]">{challenge.opponent.name}</span>
          <span className="text-[#A1A1A1]">
            {challenge.opponentProgress}/{challenge.targetCount}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${opponentPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
