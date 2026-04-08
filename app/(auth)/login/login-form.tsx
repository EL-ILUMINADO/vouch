"use client";

import { useActionState } from "react";
import { loginUser, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginUser, initialState);

  return (
    <form action={action} className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="uppercase text-xs font-bold tracking-widest text-muted-foreground"
          >
            Institution Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="student@uniben.edu"
            required
            disabled={isPending}
            className="h-14 text-lg bg-transparent border-t-0 border-x-0 border-b-2 border-border rounded-none focus-visible:ring-0 focus-visible:border-foreground px-0 transition-colors disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label
              htmlFor="password"
              className="uppercase text-xs font-bold tracking-widest text-muted-foreground"
            >
              Passphrase
            </Label>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isPending}
            className="h-14 text-lg bg-transparent border-t-0 border-x-0 border-b-2 border-border rounded-none focus-visible:ring-0 focus-visible:border-foreground px-0 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {state.error && (
        <div
          className="text-sm font-medium text-destructive"
          role="alert"
          aria-live="polite"
        >
          {state.error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full h-14 text-base font-bold rounded-2xl bg-linear-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-rose-200/60 dark:shadow-none disabled:cursor-not-allowed"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
