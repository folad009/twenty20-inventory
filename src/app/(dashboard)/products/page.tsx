import {
  getProductsAction,
  getCategoriesAction,
  canMutateProductsAction,
} from "@/server/actions/products";
import { ProductsClient } from "@/components/products/products-client";

export default async function ProductsPage() {
  const [products, categories, canMutate] = await Promise.all([
    getProductsAction({ page: 1 }),
    getCategoriesAction(),
    canMutateProductsAction(),
  ]);

  return (
    <ProductsClient
      initialData={products}
      categories={categories}
      canMutate={canMutate}
    />
  );
}
