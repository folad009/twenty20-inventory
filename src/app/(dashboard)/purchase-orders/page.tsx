import { auth } from "@/auth";
import { canMutate } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import {
  getPurchaseOrdersAction,
  getPoFormDataAction,
} from "@/server/actions/purchase-orders";
import { PurchaseOrdersClient } from "@/components/purchase-orders/purchase-orders-client";

export default async function PurchaseOrdersPage() {
  const session = await auth();
  const role = (session?.user?.role as Role) ?? Role.VIEWER;

  const [orders, formData] = await Promise.all([
    getPurchaseOrdersAction({ page: 1 }),
    getPoFormDataAction(),
  ]);

  return (
    <PurchaseOrdersClient
      initialData={orders}
      formData={formData}
      canMutate={canMutate(role)}
    />
  );
}
