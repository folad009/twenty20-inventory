import { auth } from "@/auth";
import { canMutate } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import { getScanFormDataAction } from "@/server/actions/scan";
import { ScanClient } from "@/components/scan/scan-client";

export default async function ScanPage() {
  const session = await auth();
  const role = (session?.user?.role as Role) ?? Role.VIEWER;
  const locations = await getScanFormDataAction();

  return <ScanClient locations={locations} canMutate={canMutate(role)} />;
}
