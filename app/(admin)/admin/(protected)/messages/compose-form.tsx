"use client";

import * as React from "react";
import { useActionState } from "react";
import { sendAdminMessage, type SendMessageState } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, X, ChevronDown } from "lucide-react";

const initialState: SendMessageState = {};

const MESSAGE_TYPES = [
  { value: "announcement", label: "Announcement" },
  { value: "promotion", label: "Promotion" },
  { value: "warning", label: "Warning" },
];

interface User {
  id: string;
  name: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Searchable recipient picker
// ---------------------------------------------------------------------------

function RecipientPicker({
  users,
  defaultRecipientId,
}: {
  users: User[];
  defaultRecipientId?: string;
}) {
  const defaultUser = defaultRecipientId
    ? users.find((u) => u.id === defaultRecipientId)
    : null;

  const [query, setQuery] = React.useState(defaultUser ? defaultUser.name : "");
  const [selected, setSelected] = React.useState<User | "all" | null>(
    defaultRecipientId === "all" ? "all" : defaultUser ? defaultUser : null,
  );
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedId = selected === "all" ? "all" : selected ? selected.id : "";

  const filtered = query
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()),
      )
    : users;

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const choose = (user: User | "all") => {
    setSelected(user);
    setQuery(user === "all" ? "" : user.name);
    setOpen(false);
  };

  const clear = () => {
    setSelected(null);
    setQuery("");
    setOpen(true);
  };

  const displayLabel =
    selected === "all"
      ? "📢 All Users (Broadcast)"
      : selected
        ? `${selected.name} — ${selected.email}`
        : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input carries the value for form submission */}
      <input type="hidden" name="recipientId" value={selectedId} />

      <div
        className={`flex items-center gap-2 w-full h-10 rounded-lg bg-zinc-800 border px-3 transition-colors ${
          open ? "border-zinc-500" : "border-zinc-700"
        }`}
        onClick={() => setOpen((v) => !v)}
      >
        {selected ? (
          <>
            <span className="flex-1 text-sm text-white truncate">
              {displayLabel}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <Search size={14} className="text-zinc-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search by name or email…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            />
            <ChevronDown size={14} className="text-zinc-500 shrink-0" />
          </>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {/* Broadcast option */}
          <button
            type="button"
            onClick={() => choose("all")}
            className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="text-base">📢</span>
            <span>All Users (Broadcast)</span>
          </button>
          <div className="h-px bg-zinc-700/60 mx-3" />

          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">No users found.</p>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => choose(u)}
                className="w-full text-left px-4 py-2.5 hover:bg-zinc-700 transition-colors"
              >
                <p className="text-sm text-white font-medium">{u.name}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compose form
// ---------------------------------------------------------------------------

export function ComposeForm({
  users,
  defaultRecipientId,
  defaultContent,
}: {
  users: User[];
  defaultRecipientId?: string;
  defaultContent?: string;
}) {
  const [state, action, isPending] = useActionState(
    sendAdminMessage,
    initialState,
  );

  return (
    <form action={action} className="space-y-5">
      {/* Recipient */}
      <div className="space-y-2">
        <Label className="uppercase text-xs font-bold tracking-widest text-zinc-400">
          Recipient
        </Label>
        <RecipientPicker
          users={users}
          defaultRecipientId={defaultRecipientId}
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label className="uppercase text-xs font-bold tracking-widest text-zinc-400">
          Type
        </Label>
        <div className="flex flex-wrap gap-2">
          {MESSAGE_TYPES.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm cursor-pointer has-checked:border-white has-checked:text-white transition-colors"
            >
              <input
                type="radio"
                name="type"
                value={value}
                defaultChecked={value === "announcement"}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label className="uppercase text-xs font-bold tracking-widest text-zinc-400">
          Message
        </Label>
        <textarea
          name="content"
          required
          rows={5}
          defaultValue={defaultContent}
          placeholder="Write your message..."
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-500 placeholder:text-zinc-600"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-400 font-medium">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-400 font-medium">Message sent.</p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="bg-white text-zinc-900 hover:bg-zinc-100 font-bold h-10 px-6"
      >
        {isPending ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
