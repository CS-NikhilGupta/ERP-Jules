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
import { RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function JournalPage() {
  const { journalEntries, fetchJournalEntries, isLoading } = useStore();

  useEffect(() => {
    fetchJournalEntries();
  }, [fetchJournalEntries]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Journal Entries</h1>
        <Button variant="outline" size="sm" onClick={() => fetchJournalEntries()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Total Debit</TableHead>
              <TableHead className="text-right">Total Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {journalEntries.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No journal entries found.</TableCell>
                </TableRow>
            ) : (
                journalEntries.map((entry) => {
                    const totalDebit = entry.lines?.reduce((sum, line) => sum + (line.debit || 0), 0) || 0;
                    const totalCredit = entry.lines?.reduce((sum, line) => sum + (line.credit || 0), 0) || 0;

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-xs">{entry.reference}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(totalDebit)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(totalCredit)}</TableCell>
                      </TableRow>
                    )
                })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
