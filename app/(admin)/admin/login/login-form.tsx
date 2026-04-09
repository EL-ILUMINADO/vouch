"use client";

import { useActionState } from "react";
import { adminLogin, type AdminLoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, action, isPending] = useActionState(adminLogin, initialState);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="uppercase text-xs font-bold tracking-widest text-zinc-400"
          >
            Admin Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            disabled={isPending}
            className="h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-500 focus-visible:border-zinc-500"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="uppercase text-xs font-bold tracking-widest text-zinc-400"
          >
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isPending}
            className="h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-500 focus-visible:border-zinc-500"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-400 font-medium" role="alert">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 bg-white text-zinc-900 hover:bg-zinc-100 font-bold"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
