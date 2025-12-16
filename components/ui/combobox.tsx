"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Product } from "@/types"

// Simple Combobox implementation mimicking Shadcn's Command/Popover structure
// without full Command primitive dependencies for simplicity in this generated environment.

interface ProductComboboxProps {
  products: Product[]
  onSelect: (product: Product) => void
}

export function ProductCombobox({ products, onSelect }: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null)

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (product: Product) => {
    setSelectedProductId(product.id)
    onSelect(product)
    setOpen(false)
    setSearch("")
  }

  return (
    <div className="relative w-full">
        <div
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            onClick={() => setOpen(!open)}
        >
            {selectedProductId
                ? products.find(p => p.id === selectedProductId)?.name
                : "Select product..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </div>

        {open && (
             <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                <div className="p-2 sticky top-0 bg-popover border-b">
                    <input
                        type="text"
                        placeholder="Search name or SKU..."
                        className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="p-1">
                    {filteredProducts.length === 0 ? (
                        <div className="py-6 text-center text-sm">No product found.</div>
                    ) : (
                        filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                    selectedProductId === product.id ? "bg-accent text-accent-foreground" : ""
                                )}
                                onClick={() => handleSelect(product)}
                            >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedProductId === product.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <div className="flex flex-col">
                                    <span>{product.name}</span>
                                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>
        )}
    </div>
  )
}
