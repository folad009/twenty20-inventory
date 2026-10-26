"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth-utils";
import type { ActionResult } from "@/server/actions/auth";
import * as settingsService from "@/server/services/settingsService";
import type { UserCreateInput, UserUpdateInput } from "@/lib/validations";

function toError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Invalid input";
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

export async function getUsersAction() {
  await requireRole(Role.ADMIN);
  return settingsService.listUsers();
}

export async function createUserAction(
  input: UserCreateInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole(Role.ADMIN);
    const user = await settingsService.createUser(input);
    revalidatePath("/settings");
    return { success: true, data: { id: user.id } };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}

export async function updateUserAction(
  input: UserUpdateInput,
): Promise<ActionResult> {
  try {
    await requireRole(Role.ADMIN);
    await settingsService.updateUser(input);
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requireRole(Role.ADMIN);
    await settingsService.deleteUser(actor.id, id);
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}
