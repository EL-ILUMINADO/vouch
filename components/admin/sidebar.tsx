"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminSignOut } from "@/app/(admin)/admin/login/actions";
import {
  LayoutDashboard,
  ShieldCheck,
  Flag,
  MessageSquare,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    href: "/admin/verifications",
    label: "Verifications",
    icon: ShieldCheck,
    exact: false,
  },
  { href: "/admin/reports", label: "Reports", icon: Flag, exact: false },
  {
    href: "/admin/messages",
    label: "Messages",
    icon: MessageSquare,
    exact: false,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      <div className="px-6 py-5 border-b border-zinc-800">
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
          Vouch
        </p>
        <p className="text-white font-black text-lg leading-tight">
          Admin Panel
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-800">
        <form action={adminSignOut}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors w-full"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
