"use client";

import { useActionState } from "react";
import { registerUser, type RegisterState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_UNIVERSITIES } from "@/lib/constants/universities";

const initialState: RegisterState = {};

export function VouchForm() {
  const [state, action, isPending] = useActionState(registerUser, initialState);

  return (
    <form
      action={action}
      className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8"
    >
      <div className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          01. Security
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vouchCode">Vouch Code</Label>
            <Input
              id="vouchCode"
              name="vouchCode"
              placeholder="VC-XXXX-XXXX"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Institution Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@uni.edu"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passphrase</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          02. Identity
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="John Doe"
              required
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Select name="university" required disabled={isPending}>
                <SelectTrigger className="h-10 rounded-none bg-transparent">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_UNIVERSITIES.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id}>
                      {uni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select name="level" required disabled={isPending}>
                <SelectTrigger className="h-10 rounded-none bg-transparent">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "100L",
                    "200L",
                    "300L",
                    "400L",
                    "500L",
                    "600L",
                    "Post-Grad",
                  ].map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              placeholder="Architecture"
              required
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="md:col-span-2 pt-6 border-t border-border mt-4">
        {state.error && (
          <p
            className="text-sm font-bold uppercase tracking-tighter text-destructive mb-6"
            role="alert"
          >
            {state.error}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 font-bold rounded-2xl bg-linear-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-rose-200/60 dark:shadow-none transition-all"
          disabled={isPending}
        >
          {isPending ? "Creating account..." : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
