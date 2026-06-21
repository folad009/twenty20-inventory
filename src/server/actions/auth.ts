"use server";

import { signIn, signOut } from "@/auth";
import { requireAuth } from "@/lib/auth-utils";
import { AuthError } from "next-auth";
import { loginSchema } from "@/lib/validations";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: "Invalid email or password" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password" };
    }
    throw error;
  }
}

export async function signOutAction() {
  await requireAuth();
  await signOut({ redirectTo: "/login" });
}
