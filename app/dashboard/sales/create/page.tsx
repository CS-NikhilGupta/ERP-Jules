"use client"

import * as React from "react"
import Image from "next/image"
import { useStore } from "@/store/useStore"
import { ProductCombobox } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Product } from "@/types"
import { PrintableInvoice } from "@/components/PrintableInvoice"
import { Trash2, Printer, Plus, RefreshCw } from "lucide-react"

export default function CreateQuotePage() {
    const {
        products,
        cart,
        quoteDetails,
        addToCart,
        updateCartItem,
        removeFromCart,
        setQuoteDetails,
        clearCart,
        fetchInventory,
        isLoading
    } = useStore()

    const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)

    // Ensure we have fresh stock data
    React.useEffect(() => {
        // We might want to re-fetch on mount if not already there,
        // but for now relying on user context or manual refresh is OK.
        // fetchInventory(); // Optional auto-fetch
    }, [fetchInventory]);

    // Derived State for Calculations
    const subtotal = cart.reduce((sum, item) => {
        const itemTotal = (item.price_retail * item.quantity) * ((100 - item.discount) / 100);
        return sum + itemTotal;
    }, 0);

    const gst = (subtotal + (quoteDetails.laborCharges || 0)) * 0.18;
    const grandTotal = subtotal + (quoteDetails.laborCharges || 0) + gst;

    const handleAddToCart = () => {
        if (selectedProduct) {
            addToCart(selectedProduct);
            setSelectedProduct(null); // Reset selection
        }
    }

    const handlePrint = () => {
        window.print();
    }

    return (
        <div className="space-y-6 pb-20">
             <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">Create Quote</h1>
                    <Button variant="ghost" size="sm" onClick={() => fetchInventory()} disabled={isLoading}>
                         <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <div className="space-x-2">
                     <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
                        Clear
                     </Button>
                     <Button onClick={handlePrint} disabled={cart.length === 0}>
                        <Printer className="mr-2 h-4 w-4"/>
                        Print Quote
                     </Button>
                </div>
             </div>

             {/* Customer Details Section */}
             <Card className="print:hidden">
                 <CardHeader>
                     <CardTitle className="text-base">Customer Details</CardTitle>
                 </CardHeader>
                 <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-2">
                         <Label htmlFor="c-name">Name</Label>
                         <Input
                            id="c-name"
                            placeholder="John Doe"
                            value={quoteDetails.customerName}
                            onChange={(e) => setQuoteDetails({ customerName: e.target.value })}
                         />
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="c-phone">Phone</Label>
                         <Input
                            id="c-phone"
                            placeholder="(555) 123-4567"
                            value={quoteDetails.customerPhone}
                            onChange={(e) => setQuoteDetails({ customerPhone: e.target.value })}
                         />
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="c-address">Address</Label>
                         <Input
                            id="c-address"
                            placeholder="123 Main St, City"
                            value={quoteDetails.customerAddress}
                            onChange={(e) => setQuoteDetails({ customerAddress: e.target.value })}
                         />
                     </div>
                 </CardContent>
             </Card>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
                {/* LEFT COLUMN: Product Picker */}
                <div className="lg:col-span-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Find Product</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ProductCombobox products={products} onSelect={setSelectedProduct} />

                            {selectedProduct && (
                                <div className="rounded-md border p-4 space-y-3 bg-muted/20">
                                    <div className="relative aspect-square w-full overflow-hidden rounded-md border bg-muted">
                                        <Image
                                            src={selectedProduct.imageUrl}
                                            alt={selectedProduct.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{selectedProduct.name}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedProduct.sku}</p>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Showroom Stock:</span>
                                        <span className={selectedProduct.stock_showroom > 0 ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                                            {selectedProduct.stock_showroom}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Price:</span>
                                        <span className="font-medium">${selectedProduct.price_retail.toFixed(2)}</span>
                                    </div>
                                    <Button className="w-full" onClick={handleAddToCart} disabled={selectedProduct.stock_showroom < 1}>
                                        <Plus className="mr-2 h-4 w-4"/>
                                        Add to Quote
                                    </Button>
                                    {selectedProduct.stock_showroom < 1 && (
                                        <p className="text-xs text-red-500 text-center">Out of stock in showroom</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Cart & Totals */}
                <div className="lg:col-span-8 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Cart ({cart.length} items)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]"></TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="w-[100px]">Price</TableHead>
                                        <TableHead className="w-[100px]">Qty</TableHead>
                                        <TableHead className="w-[100px]">Disc %</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cart.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                                No items added yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cart.map((item) => {
                                            const lineTotal = (item.price_retail * item.quantity) * ((100 - item.discount) / 100);
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div className="relative h-12 w-12 rounded border overflow-hidden">
                                                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover"/>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {item.name}
                                                        <div className="text-xs text-muted-foreground">{item.sku}</div>
                                                    </TableCell>
                                                    <TableCell>${item.price_retail}</TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            className="h-8 w-20"
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (val > 0) updateCartItem(item.id, { quantity: val });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            className="h-8 w-20"
                                                            value={item.discount}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (val >= 0 && val <= 100) updateCartItem(item.id, { discount: val });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        ${lineTotal.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeFromCart(item.id)}>
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Totals Section */}
                    {cart.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-3 items-end">
                                    <div className="flex justify-between w-full max-w-xs text-sm">
                                        <span className="text-muted-foreground">Subtotal:</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between w-full max-w-xs items-center gap-4">
                                        <Label htmlFor="labor" className="text-sm text-muted-foreground whitespace-nowrap">Labor / Install:</Label>
                                        <div className="relative w-32">
                                            <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">$</span>
                                            <Input
                                                id="labor"
                                                type="number"
                                                min="0"
                                                className="pl-6 h-9 text-right"
                                                value={quoteDetails.laborCharges || ''}
                                                onChange={(e) => setQuoteDetails({ laborCharges: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between w-full max-w-xs text-sm">
                                        <span className="text-muted-foreground">GST (18%):</span>
                                        <span>${gst.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full max-w-xs border-t pt-2 mt-2">
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Grand Total:</span>
                                            <span>${grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
             </div>

             {/* Print Component (Hidden) */}
             <PrintableInvoice />
        </div>
    )
}
