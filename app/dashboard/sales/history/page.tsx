"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Order } from "@/types";

export default function OrderHistoryPage() {
  const { orders, fetchOrders, fetchOrderDetails, isLoading } = useStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewDetails = async (order: Order) => {
      setSelectedOrder(order);
      setIsDetailOpen(true);
      if (!order.items) {
          await fetchOrderDetails(order.id);
      }
  }

  // Filter only completed orders for History
  const completedOrders = orders.filter(o => o.status === 'completed');

  // Logic to get items for selected order from store (since fetchOrderDetails updates store)
  const activeOrder = selectedOrder ? orders.find(o => o.id === selectedOrder.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
        <Button variant="outline" size="sm" onClick={() => fetchOrders()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completedOrders.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No completed sales found.</TableCell>
                </TableRow>
            ) : (
                completedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-xs">{order.order_number || order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{order.customer_info?.customerName || 'Guest'}</span>
                            <span className="text-xs text-muted-foreground">{order.customer_info?.customerPhone}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="default" className="bg-green-600">Completed</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.total || 0)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details #{activeOrder?.order_number || activeOrder?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
                {new Date(activeOrder?.created_at || '').toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {activeOrder && (
              <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                          <h4 className="font-semibold mb-1">Customer</h4>
                          <p>{activeOrder.customer_info?.customerName}</p>
                          <p>{activeOrder.customer_info?.customerPhone}</p>
                          <p>{activeOrder.customer_info?.customerAddress}</p>
                      </div>
                      <div className="text-right">
                          <h4 className="font-semibold mb-1">Summary</h4>
                          <p>Total: <span className="font-bold">{formatCurrency(activeOrder.total)}</span></p>
                          <p>Status: {activeOrder.status}</p>
                      </div>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!activeOrder.items ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4">Loading items...</TableCell>
                                </TableRow>
                            ) : activeOrder.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-medium">{item.product?.name || 'Unknown Product'}</div>
                                        <div className="text-xs text-muted-foreground">{item.product?.sku}</div>
                                    </TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </div>
              </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
