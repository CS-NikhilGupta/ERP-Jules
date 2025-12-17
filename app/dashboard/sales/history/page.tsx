"use client";

import { useEffect } from "react";
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
import { RefreshCw, FileText } from "lucide-react";

export default function OrderHistoryPage() {
  const { orders, fetchOrders, isLoading } = useStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
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
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No orders found.</TableCell>
                </TableRow>
            ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{order.customer_info?.customerName || 'Guest'}</span>
                            <span className="text-xs text-muted-foreground">{order.customer_info?.customerPhone}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">${order.total?.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => alert("Reprint functionality to be implemented (requires loading order into context)")}>
                            <FileText className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
