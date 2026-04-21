"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminSignOut } from "@/app/(admin)/admin/login/actions";
import {
  LayoutDashboard,
  ShieldCheck,
  Flag,
  MessageSquare,
  Users,
  LogOut,
  Menu,
  X,
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
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full w-60 bg-zinc-950 border-r border-zinc-800">
      <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
            Vouch
          </p>
          <p className="text-white font-black text-lg leading-tight">
            Admin Panel
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors lg:hidden"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
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

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex">
        <SidebarContent />
      </div>

      {/* Mobile: top bar with hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-4 px-4 py-3 bg-zinc-950 border-b border-zinc-800">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu size={18} />
        </button>
        <div>
          <p className="text-white font-black text-base leading-tight">
            vouch<span className="text-rose-500">.</span> Admin
          </p>
        </div>
      </div>

      {/* Mobile: backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile: slide-in sidebar */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>
    </>
  );
}
