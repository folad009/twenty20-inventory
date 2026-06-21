import { auth } from "@/auth";
import { canMutate } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import {
  getTransfersAction,
  getTransferFormDataAction,
} from "@/server/actions/transfers";
import { TransfersClient } from "@/components/transfers/transfers-client";

export default async function TransfersPage() {
  const session = await auth();
  const role = (session?.user?.role as Role) ?? Role.VIEWER;

  const [transfers, formData] = await Promise.all([
    getTransfersAction({ page: 1 }),
    getTransferFormDataAction(),
  ]);

  return (
    <TransfersClient
      initialData={transfers}
      products={formData.products}
      locations={formData.locations}
      canMutate={canMutate(role)}
    />
  );
}
