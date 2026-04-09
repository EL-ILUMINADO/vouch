"use server";

import { createAdminSession, deleteAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export type AdminLoginState = {
  error?: string;
};

export async function adminLogin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return { error: "Admin credentials are not configured." };
  }

  if (email !== adminEmail || password !== adminPassword) {
    return { error: "Invalid admin credentials." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function adminSignOut(): Promise<void> {
  await deleteAdminSession();
  redirect("/admin/login");
}
