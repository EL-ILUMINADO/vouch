import { Heart, Radio, Star, Users, AlertTriangle } from "lucide-react";
import { StatCard } from "./ui";

export function UserStats({
  totalHandshakes,
  likesReceivedCount,
  likesSentCount,
  radarPendingIncoming,
  warningCount,
  trustScore,
}: {
  totalHandshakes: number;
  likesReceivedCount: number;
  likesSentCount: number;
  radarPendingIncoming: number;
  warningCount: number;
  trustScore: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        icon={<Users className="w-4 h-4 text-emerald-400" />}
        label="Handshakes"
        value={totalHandshakes}
        accent="bg-emerald-500/10"
      />
      <StatCard
        icon={<Heart className="w-4 h-4 text-rose-400" />}
        label="Likes Pending"
        value={likesReceivedCount}
        sub="received"
        accent="bg-rose-500/10"
      />
      <StatCard
        icon={<Heart className="w-4 h-4 text-pink-400" />}
        label="Likes Sent"
        value={likesSentCount}
        sub="pending"
        accent="bg-pink-500/10"
      />
      <StatCard
        icon={<Radio className="w-4 h-4 text-blue-400" />}
        label="Radar Pings"
        value={radarPendingIncoming}
        sub="incoming"
        accent="bg-blue-500/10"
      />
      <StatCard
        icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        label="Warnings"
        value={`${warningCount}/3`}
        accent="bg-amber-500/10"
      />
      <StatCard
        icon={<Star className="w-4 h-4 text-yellow-400" />}
        label="Trust Score"
        value={trustScore}
        accent="bg-yellow-500/10"
      />
    </div>
  );
}
