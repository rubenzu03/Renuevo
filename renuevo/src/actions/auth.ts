"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";

export type LoginState = { error: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!process.env.APP_PASSWORD) {
    return { error: "Auth is not configured" };
  }

  const password = String(formData.get("password") ?? "");
  const ok = await login(password);
  if (!ok) return { error: "Wrong password" };

  let next = String(formData.get("next") ?? "/");
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}
