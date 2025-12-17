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
import { RefreshCw, ArrowRightCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function QuotesPage() {
  const { quotes, fetchQuotes, convertQuoteToSale, isLoading } = useStore();
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleConvertToSale = async (quoteId: string) => {
      if (!confirm("Are you sure you want to convert this quote to a completed sale? This will deduct stock.")) return;

      setProcessingId(quoteId);
      try {
          await convertQuoteToSale(quoteId);
          alert("Quote converted to sale successfully!");
          fetchQuotes(); // Refresh list
      } catch (e: unknown) {
          if (e instanceof Error) {
            alert("Error converting quote: " + e.message);
          } else {
            alert("Error converting quote: Unknown error");
          }
      } finally {
          setProcessingId(null);
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Active Quotes</h1>
        <Button variant="outline" size="sm" onClick={() => fetchQuotes()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Quote #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No active quotes found.</TableCell>
                </TableRow>
            ) : (
                quotes.map((order) => (
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
                        <Badge variant="secondary">Quote</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.total || 0)}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                             {/* Future: Edit Quote functionality would go here (load into cart) */}
                            <Button
                                size="sm"
                                onClick={() => handleConvertToSale(order.id)}
                                disabled={processingId === order.id}
                            >
                                <ArrowRightCircle className="mr-2 h-4 w-4" />
                                {processingId === order.id ? "Converting..." : "Convert to Sale"}
                            </Button>
                        </div>
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
