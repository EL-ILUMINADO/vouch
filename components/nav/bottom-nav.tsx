"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, User, Zap, MessageCircle, Heart, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/components/notification-provider";

interface BottomNavProps {
  likesCount?: number;
  chatsCount?: number;
  radarRequestCount?: number;
  notificationsCount?: number;
  profileAlert?: boolean;
}

export function BottomNav({
  likesCount = 0,
  chatsCount = 0,
  radarRequestCount = 0,
  notificationsCount = 0,
  profileAlert = false,
}: BottomNavProps) {
  const pathname = usePathname();
  const { unreadCount: liveUnreadCount } = useNotifications();

  const [counts, setCounts] = React.useState({
    likes: likesCount,
    chats: chatsCount,
    radar: radarRequestCount,
  });

  React.useEffect(() => {
    setCounts({
      likes: likesCount,
      chats: chatsCount,
      radar: radarRequestCount,
    });
  }, [likesCount, chatsCount, radarRequestCount]);

  // Clear other badges instantly on navigation.
  React.useEffect(() => {
    if (pathname.startsWith("/likes")) setCounts((c) => ({ ...c, likes: 0 }));
    if (pathname.startsWith("/chats") || pathname.startsWith("/uplink"))
      setCounts((c) => ({ ...c, radar: 0 }));
  }, [pathname]);

  // Live notification count comes from SSE context; fallback to server prop
  // for the initial render before the stream connects.
  const notificationBadge = liveUnreadCount ?? notificationsCount;

  const navItems = [
    {
      name: "Radar",
      href: "/radar",
      icon: Map,
      badge: counts.radar,
      dot: false,
    },
    { name: "Discover", href: "/discover", icon: Zap, badge: 0, dot: false },
    {
      name: "Likes",
      href: "/likes",
      icon: Heart,
      badge: counts.likes,
      dot: false,
    },
    {
      name: "Activity",
      href: "/notifications",
      icon: Bell,
      badge: notificationBadge,
      dot: false,
    },
    {
      name: "Chats",
      href: "/chats",
      icon: MessageCircle,
      badge: counts.chats,
      dot: false,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      badge: 0,
      dot: profileAlert,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-safe">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all",
                isActive
                  ? "text-rose-500 dark:text-rose-400 scale-105"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-4.5 h-4.5",
                    isActive && "fill-rose-500/10 dark:fill-rose-400/10",
                  )}
                />
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-4 h-4 px-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                {item.dot && item.badge === 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-background" />
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {item.name}
              </span>
              {isActive && (
                <div className="absolute -top-px w-6 h-1 bg-rose-500 dark:bg-rose-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
