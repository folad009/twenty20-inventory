import { auth } from "@/auth";
import { canMutate } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import { getSuppliersAction } from "@/server/actions/suppliers";
import { SuppliersClient } from "@/components/suppliers/suppliers-client";

export default async function SuppliersPage() {
  const session = await auth();
  const role = (session?.user?.role as Role) ?? Role.VIEWER;
  const suppliers = await getSuppliersAction({ page: 1 });

  return (
    <SuppliersClient initialData={suppliers} canMutate={canMutate(role)} />
  );
}
