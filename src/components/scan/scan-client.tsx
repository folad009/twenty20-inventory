"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import type { Category, Location, Product, StockLevel } from "@prisma/client";
import { Minus, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataPanel } from "@/components/shared/data-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StockStatusBadge } from "@/components/shared/status-badges";
import { BarcodeScanner } from "@/components/scan/barcode-scanner";
import {
  lookupByBarcodeAction,
  scanAdjustStockAction,
} from "@/server/actions/scan";

type ProductMatch = Product & {
  category: Category | null;
  stockLevels: Array<StockLevel & { location: Location }>;
};

type ScanClientProps = {
  locations: Location[];
  canMutate: boolean;
};

export function ScanClient({ locations, canMutate }: ScanClientProps) {
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState<ProductMatch | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();

  const lookup = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setBarcode(trimmed);
    setNotFound(false);
    setProduct(null);

    startTransition(async () => {
      const match = await lookupByBarcodeAction(trimmed);
      if (!match) {
        setNotFound(true);
        toast.error("No product found for this barcode");
        return;
      }
      setProduct(match as ProductMatch);
      if (match.stockLevels[0]) {
        setLocationId(match.stockLevels[0].locationId);
      } else if (locations[0]) {
        setLocationId(locations[0].id);
      }
    });
  }, [locations]);

  async function handleAdjust(sign: 1 | -1) {
    if (!product) return;

    const qty = sign * Math.abs(quantity);
    const result = await scanAdjustStockAction({
      productId: product.id,
      locationId,
      quantity: qty,
      reason: `Barcode scan (${product.barcode})`,
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(
      sign > 0
        ? `Added ${Math.abs(quantity)} to stock`
        : `Removed ${Math.abs(quantity)} from stock`,
    );

    lookup(product.barcode ?? barcode);
  }

  const levelForLocation = product?.stockLevels.find(
    (l) => l.locationId === locationId,
  );

  return (
    <div className="page-shell">
      <PageHeader
        title="Scan"
        description="Look up products by barcode and apply quick stock adjustments"
      />

      <DataPanel title="Barcode lookup" description="Manual entry or camera scan">
        <div className="p-4 md:p-5">
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="manual">Manual entry</TabsTrigger>
              <TabsTrigger value="camera">Camera</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="flex flex-col gap-4">
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  lookup(barcode);
                }}
              >
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="barcode-input">Barcode</Label>
                  <Input
                    id="barcode-input"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Enter or paste barcode"
                    autoComplete="off"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={pending || !barcode.trim()}>
                    <Search data-icon="inline-start" />
                    Look up
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="camera">
              <BarcodeScanner onScan={lookup} paused={pending} />
              {barcode && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Last scanned: <span className="font-mono">{barcode}</span>
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DataPanel>

      {notFound && (
        <Alert variant="destructive">
          <AlertDescription>
            No active product matches barcode &quot;{barcode}&quot;.
          </AlertDescription>
        </Alert>
      )}

      {product && (
        <DataPanel
          title={product.name}
          description={[
            product.sku,
            product.barcode ? `Barcode ${product.barcode}` : null,
            product.category?.name ?? null,
          ]
            .filter(Boolean)
            .join(" · ")}
        >
          <div className="flex flex-col gap-6 p-4 md:p-5">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Stock by location</p>
              {product.stockLevels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stock levels yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {product.stockLevels.map((level) => (
                    <li
                      key={level.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-muted/40"
                    >
                      <span className="font-medium">{level.location.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tabular-nums">
                          {level.quantityOnHand}
                        </span>
                        <StockStatusBadge
                          quantity={level.quantityOnHand}
                          threshold={product.reorderThreshold}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canMutate && (
              <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/15 p-4">
                <p className="text-sm font-medium">Quick adjust</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="location">Location</Label>
                    <select
                      id="location"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      className="form-select"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      >
                        <Minus />
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setQuantity((q) => q + 1)}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                </div>

                {levelForLocation !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    Current on hand at selected location:{" "}
                    <span className="font-medium text-foreground">
                      {levelForLocation?.quantityOnHand ?? 0}
                    </span>
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => handleAdjust(1)}
                    disabled={pending || !locationId}
                  >
                    <Plus data-icon="inline-start" />
                    Add stock
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAdjust(-1)}
                    disabled={pending || !locationId}
                  >
                    <Minus data-icon="inline-start" />
                    Remove stock
                  </Button>
                </div>
              </div>
            )}

            {!canMutate && (
              <Alert>
                <AlertDescription>
                  Viewers can look up products but cannot adjust stock.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DataPanel>
      )}
    </div>
  );
}
