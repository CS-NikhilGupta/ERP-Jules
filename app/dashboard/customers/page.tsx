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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw, UserPlus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CustomersPage() {
  const { customers, fetchCustomers, createCustomer, isLoading } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreate = async () => {
      setSaving(true);
      try {
          await createCustomer({
              name: newCustomer.name,
              phone: newCustomer.phone,
              email: newCustomer.email,
              address: newCustomer.address,
              total_spent: 0
          });
          setIsDialogOpen(false);
          setNewCustomer({ name: '', phone: '', email: '', address: '' });
          fetchCustomers();
      } catch (e: unknown) {
          if (e instanceof Error) {
            alert("Error creating customer: " + e.message);
          } else {
            alert("Error creating customer: Unknown error");
          }
      } finally {
          setSaving(false);
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchCustomers()} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Customer
            </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No customers found.</TableCell>
                </TableRow>
            ) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{c.address}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.total_spent || 0)}</TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Full Name" />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="Phone Number" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="Email Address" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="Billing Address" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !newCustomer.name || !newCustomer.phone}>
                {saving ? "Saving..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
