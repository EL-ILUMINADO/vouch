"use client";

import PusherClient from "pusher-js";

export const getPusherClient = () => {
  if (typeof window === "undefined") return null;

  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });
};
