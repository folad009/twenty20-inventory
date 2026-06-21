import { auth } from "@/auth";
import { canMutate } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import {
  getStockLevelsAction,
  getLocationsAction,
  getProductsForStockAction,
} from "@/server/actions/stock";
import { StockClient } from "@/components/stock/stock-client";

export default async function StockPage() {
  const session = await auth();
  const role = (session?.user?.role as Role) ?? Role.VIEWER;

  const [levels, products, locations] = await Promise.all([
    getStockLevelsAction({ page: 1 }),
    getProductsForStockAction(),
    getLocationsAction(),
  ]);

  return (
    <StockClient
      initialLevels={levels}
      products={products}
      locations={locations}
      canMutate={canMutate(role)}
    />
  );
}
