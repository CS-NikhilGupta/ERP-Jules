"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function SalesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Sales & Quotes</h1>
            <p className="text-muted-foreground text-center max-w-md">
                Manage your quotes, orders, and customer interactions here. Start by creating a new quote.
            </p>
            <Link href="/dashboard/sales/create">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Quote
                </Button>
            </Link>
        </div>
    )
}
