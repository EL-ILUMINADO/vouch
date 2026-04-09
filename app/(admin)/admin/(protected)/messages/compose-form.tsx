"use client";

import { useActionState } from "react";
import { sendAdminMessage, type SendMessageState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function ComposeForm({ users }: { users: User[] }) {
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
        <select
          name="recipientId"
          required
          className="w-full h-10 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          <option value="all">📢 All Users (Broadcast)</option>
          <optgroup label="Specific User">
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.email}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label className="uppercase text-xs font-bold tracking-widest text-zinc-400">
          Type
        </Label>
        <div className="flex gap-2">
          {MESSAGE_TYPES.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm cursor-pointer has-[:checked]:border-white has-[:checked]:text-white transition-colors"
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
