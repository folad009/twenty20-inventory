"use server";

import { requireAuth } from "@/lib/auth-utils";
import * as dashboardService from "@/server/services/dashboardService";

export async function getDashboardAction() {
  await requireAuth();
  return dashboardService.getDashboardStats();
}
