"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, User, Zap, MessageCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Radar", href: "/radar", icon: Map },
    { name: "Discover", href: "/discover", icon: Zap },
    { name: "Likes", href: "/likes", icon: Heart },
    { name: "Chats", href: "/chats", icon: MessageCircle },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-safe">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                isActive
                  ? "text-rose-500 dark:text-rose-400 scale-110"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isActive && "fill-rose-500/10 dark:fill-rose-400/10",
                )}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {item.name}
              </span>
              {isActive && (
                <div className="absolute -top-px w-8 h-1 bg-rose-500 dark:bg-rose-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
