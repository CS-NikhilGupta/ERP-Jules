"use client"

import * as React from "react"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/store/useStore"
import { Customer } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CustomerSearchProps {
    onSelect: (customer: Customer) => void;
    selectedCustomer?: Customer;
}

export function CustomerSearch({ onSelect, selectedCustomer }: CustomerSearchProps) {
    const { searchCustomerByPhone, createCustomer } = useStore();
    const [query, setQuery] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [notFound, setNotFound] = React.useState(false);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [newCustomer, setNewCustomer] = React.useState({ name: '', phone: '', email: '', address: '' });

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        setNotFound(false);
        const customer = await searchCustomerByPhone(query);
        if (customer) {
            onSelect(customer);
            setQuery("");
        } else {
            setNotFound(true);
        }
        setLoading(false);
    }

    const handleCreate = async () => {
        try {
            const customer = await createCustomer({
                ...newCustomer,
                total_spent: 0
            });
            onSelect(customer);
            setIsCreateOpen(false);
            setNewCustomer({ name: '', phone: '', email: '', address: '' });
        } catch (e: unknown) {
            if (e instanceof Error) {
                alert("Error: " + e.message);
            } else {
                alert("Error: Unknown error");
            }
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="Search by Phone Number..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>Search</Button>
            </div>

            {notFound && (
                <div className="p-4 border border-dashed rounded-md flex items-center justify-between bg-muted/50">
                    <span className="text-sm text-muted-foreground">Customer not found.</span>
                    <Button variant="outline" size="sm" onClick={() => {
                        setNewCustomer(prev => ({ ...prev, phone: query }));
                        setIsCreateOpen(true);
                    }}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Quick Create
                    </Button>
                </div>
            )}

            {selectedCustomer && (
                <div className="p-4 border rounded-md bg-accent/20">
                    <div className="font-medium">{selectedCustomer.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedCustomer.phone}</div>
                    <div className="text-sm text-muted-foreground truncate">{selectedCustomer.address}</div>
                </div>
            )}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Quick Create Customer</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone *</Label>
                            <Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!newCustomer.name || !newCustomer.phone}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
