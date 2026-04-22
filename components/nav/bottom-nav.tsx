"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, User, Zap, MessageCircle, Heart } from "lucide-react";
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

  React.useEffect(() => {
    if (pathname.startsWith("/likes")) setCounts((c) => ({ ...c, likes: 0 }));
    if (pathname.startsWith("/chats") || pathname.startsWith("/uplink"))
      setCounts((c) => ({ ...c, chats: 0 }));
    if (pathname.startsWith("/radar")) setCounts((c) => ({ ...c, radar: 0 }));
  }, [pathname]);

  const notificationBadge = liveUnreadCount ?? notificationsCount;

  // Profile tab shows a badge when there are unread notifications OR profile alerts
  const profileBadge = notificationBadge > 0 ? notificationBadge : 0;
  const profileDot = profileAlert && profileBadge === 0;

  const sideItems = [
    {
      name: "Radar",
      href: "/radar",
      icon: Map,
      badge: counts.radar,
    },
    {
      name: "Likes",
      href: "/likes",
      icon: Heart,
      badge: counts.likes,
    },
  ];

  const rightItems = [
    {
      name: "Chats",
      href: "/chats",
      icon: MessageCircle,
      badge: counts.chats,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      badge: profileBadge,
      dot: profileDot,
    },
  ];

  const isDiscoverActive =
    pathname === "/discover" || pathname.startsWith("/discover/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-safe">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {/* Left items */}
        {sideItems.map((item) => {
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
              {isActive && (
                <div className="absolute -top-px w-6 h-1 bg-rose-500 dark:bg-rose-400 rounded-full" />
              )}
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
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Center Discover FAB */}
        <Link
          href="/discover"
          className={cn(
            "relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all",
            isDiscoverActive
              ? "text-rose-500 dark:text-rose-400 scale-105"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-label="Discover"
        >
          {isDiscoverActive && (
            <div className="absolute -top-px w-6 h-1 bg-rose-500 dark:bg-rose-400 rounded-full" />
          )}
          <Zap
            className={cn(
              "w-4.5 h-4.5",
              isDiscoverActive && "fill-rose-500/10 dark:fill-rose-400/10",
            )}
          />
          <span className="text-[9px] font-bold uppercase tracking-widest">
            Discover
          </span>
        </Link>

        {/* Right items */}
        {rightItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/") ||
            (item.href === "/profile" && pathname.startsWith("/notifications"));
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
              {isActive && (
                <div className="absolute -top-px w-6 h-1 bg-rose-500 dark:bg-rose-400 rounded-full" />
              )}
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
                {"dot" in item && item.dot && item.badge === 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-background" />
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
