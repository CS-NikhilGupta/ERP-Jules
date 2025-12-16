"use client";

import { useState } from "react";
import Image from "next/image";
import { useStore } from "@/store/useStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/types";
import { PackagePlus } from "lucide-react";

export default function InventoryPage() {
  const { products, currentUser, receiveStock } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [amount, setAmount] = useState<number>(0);
  const [location, setLocation] = useState<'warehouse' | 'showroom'>('warehouse');

  const handleOpenReceive = (product: Product) => {
    setSelectedProduct(product);
    setAmount(0);
    setLocation('warehouse');
    setIsDialogOpen(true);
  };

  const handleReceiveStock = () => {
    if (selectedProduct && amount > 0) {
      receiveStock(selectedProduct.id, amount, location);
      setIsDialogOpen(false);
    }
  };

  // Warehouse and Admin can receive stock
  const canReceiveStock = currentUser.role === 'admin' || currentUser.role === 'warehouse';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
        {/* Global actions could go here */}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Product Details</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Stock Levels</TableHead>
              {canReceiveStock && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                    <span className="text-xs text-muted-foreground">Finish: {product.finish}</span>
                  </div>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm">
                        <span className="text-muted-foreground mr-2">Retail:</span>
                        ${product.price_retail.toFixed(2)}
                    </div>
                    {currentUser.role !== 'sales' && ( // Maybe hide dealer price from pure sales? Or maybe they need it. Assuming visibility for now.
                        <div className="text-xs text-muted-foreground">
                            <span className="mr-2">Dealer:</span>
                            ${product.price_dealer.toFixed(2)}
                        </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline" className="w-fit">
                      Showroom: {product.stock_showroom}
                    </Badge>
                    <Badge variant="secondary" className="w-fit">
                      Warehouse: {product.stock_warehouse}
                    </Badge>
                  </div>
                </TableCell>
                {canReceiveStock && (
                  <TableCell className="text-right">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReceive(product)}
                    >
                      <PackagePlus className="mr-2 h-4 w-4" />
                      Receive
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Receive Stock</DialogTitle>
            <DialogDescription>
              Add inventory for {selectedProduct?.name}. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <select
                id="location"
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={location}
                onChange={(e) => setLocation(e.target.value as 'warehouse' | 'showroom')}
              >
                <option value="warehouse">Warehouse</option>
                <option value="showroom">Showroom</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Quantity
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleReceiveStock}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
