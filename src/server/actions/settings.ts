"use server";

import { requireRole } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import * as settingsService from "@/server/services/settingsService";

export async function getUsersAction() {
  await requireRole(Role.ADMIN);
  return settingsService.listUsers();
}
