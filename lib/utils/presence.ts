const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function getPresenceLabel(lastActiveAt: Date | string | null): {
  isOnline: boolean;
  label: string;
} {
  if (!lastActiveAt) return { isOnline: false, label: "Offline" };

  const diff = Date.now() - new Date(lastActiveAt).getTime();

  if (diff < ONLINE_THRESHOLD_MS) {
    return { isOnline: true, label: "Online" };
  }

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return { isOnline: false, label: `Active ${minutes}m ago` };

  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return { isOnline: false, label: `Active ${hours}h ago` };

  const days = Math.floor(diff / 86_400_000);
  return { isOnline: false, label: `Active ${days}d ago` };
}
