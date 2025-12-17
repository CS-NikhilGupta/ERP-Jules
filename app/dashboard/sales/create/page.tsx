"use client"

import * as React from "react"
import Image from "next/image"
import { useStore } from "@/store/useStore"
import { ProductCombobox } from "@/components/ui/combobox"
import { CustomerSearch } from "@/components/CustomerSearch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Product, Customer } from "@/types"
import { PrintableInvoice } from "@/components/PrintableInvoice"
import { Trash2, Printer, Plus, RefreshCw, Save } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

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
        createOrder,
        isLoading
    } = useStore()

    const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
    const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | undefined>(undefined);
    const [isSaving, setIsSaving] = React.useState(false);

    // Sync selected customer with quote details
    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setQuoteDetails({
            customerName: customer.name,
            customerPhone: customer.phone,
            customerAddress: customer.address || '',
            customerId: customer.id
        });
    };

    // Derived State for Calculations
    // 1. Calculate Per Item
    const cartItems = cart.map(item => {
        const netRate = item.price_retail * (1 - item.discount / 100);
        const taxAmount = netRate * (item.gst_rate / 100);
        const total = (netRate + taxAmount) * item.quantity;
        return {
            ...item,
            netRate,
            taxAmount,
            lineTotal: total
        };
    });

    // 2. Footer Totals
    const totalTaxable = cartItems.reduce((sum, item) => sum + (item.netRate * item.quantity), 0);
    const totalGST = cartItems.reduce((sum, item) => sum + (item.taxAmount * item.quantity), 0);
    const labor = quoteDetails.laborCharges || 0;
    // Assuming labor is non-taxable for now, or added to taxable?
    // Usually labor is taxable service. But requirements didn't specify labor tax rate.
    // I'll leave labor as separate line item in grand total.
    const grandTotal = totalTaxable + totalGST + labor;

    const handleAddToCart = () => {
        if (selectedProduct) {
            addToCart(selectedProduct);
            setSelectedProduct(null); // Reset selection
        }
    }

    const handleAction = async (actionType: 'quote' | 'completed') => {
        setIsSaving(true);
        try {
            await createOrder(actionType);

            if (actionType === 'quote') {
                alert("Quote saved successfully!");
            } else {
                setTimeout(() => {
                    window.print();
                    clearCart();
                    setSelectedCustomer(undefined);
                }, 500);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                alert("Failed to create order: " + error.message);
            } else {
                alert("Failed to create order: Unknown error");
            }
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="space-y-6 pb-20">
             <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">Create Sales / Quote</h1>
                    <Button variant="ghost" size="sm" onClick={() => fetchInventory()} disabled={isLoading}>
                         <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <div className="space-x-2">
                     <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
                        Clear
                     </Button>
                     <Button variant="secondary" onClick={() => handleAction('quote')} disabled={cart.length === 0 || isSaving}>
                        <Save className="mr-2 h-4 w-4"/>
                        {isSaving ? "Saving..." : "Save Quote"}
                     </Button>
                     <Button onClick={() => handleAction('completed')} disabled={cart.length === 0 || isSaving}>
                        <Printer className="mr-2 h-4 w-4"/>
                        {isSaving ? "Processing..." : "Complete Sale & Print"}
                     </Button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
                {/* LEFT COLUMN: Customer & Product */}
                <div className="lg:col-span-4 space-y-4">
                     {/* Customer Search Section */}
                    <Card>
                         <CardHeader>
                             <CardTitle className="text-base">Customer Details</CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-4">
                             <CustomerSearch onSelect={handleCustomerSelect} selectedCustomer={selectedCustomer} />
                             {!selectedCustomer && (
                                <div className="space-y-2 pt-4 border-t">
                                    <div className="text-xs text-muted-foreground mb-2">Or enter manually for one-time:</div>
                                    <Input
                                        placeholder="Name"
                                        value={quoteDetails.customerName}
                                        onChange={(e) => setQuoteDetails({ customerName: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Phone"
                                        value={quoteDetails.customerPhone}
                                        onChange={(e) => setQuoteDetails({ customerPhone: e.target.value })}
                                    />
                                </div>
                             )}
                         </CardContent>
                    </Card>

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
                                        <span>MRP:</span>
                                        <span className="font-medium">{formatCurrency(selectedProduct.price_retail)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>GST Rate:</span>
                                        <span className="font-medium">{selectedProduct.gst_rate}%</span>
                                    </div>
                                    <Button className="w-full" onClick={handleAddToCart} disabled={selectedProduct.stock_showroom < 1}>
                                        <Plus className="mr-2 h-4 w-4"/>
                                        Add to Cart
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
                                        <TableHead className="w-[60px]"></TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="w-[100px]">MRP</TableHead>
                                        <TableHead className="w-[80px]">Qty</TableHead>
                                        <TableHead className="w-[80px]">Disc %</TableHead>
                                        <TableHead className="w-[100px]">Net Rate</TableHead>
                                        <TableHead className="w-[60px]">GST%</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cartItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                                No items added yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cartItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="relative h-10 w-10 rounded border overflow-hidden">
                                                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover"/>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="text-sm">{item.name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.sku}</div>
                                                </TableCell>
                                                <TableCell>{formatCurrency(item.price_retail)}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        className="h-8 w-16 px-2"
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
                                                        className="h-8 w-16 px-2"
                                                        value={item.discount}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (val >= 0 && val <= 100) updateCartItem(item.id, { discount: val });
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatCurrency(item.netRate)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {item.gst_rate}%
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(item.lineTotal)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeFromCart(item.id)}>
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
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
                                        <span className="text-muted-foreground">Total Taxable Value:</span>
                                        <span>{formatCurrency(totalTaxable)}</span>
                                    </div>
                                    <div className="flex justify-between w-full max-w-xs text-sm">
                                        <span className="text-muted-foreground">Total GST:</span>
                                        <span>{formatCurrency(totalGST)}</span>
                                    </div>

                                    <div className="flex justify-between w-full max-w-xs items-center gap-4 py-2 border-t border-dashed">
                                        <Label htmlFor="labor" className="text-sm text-muted-foreground whitespace-nowrap">Labor / Install:</Label>
                                        <div className="relative w-32">
                                            <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">₹</span>
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

                                    <div className="w-full max-w-xs border-t pt-2 mt-2">
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Grand Total:</span>
                                            <span>{formatCurrency(grandTotal)}</span>
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
