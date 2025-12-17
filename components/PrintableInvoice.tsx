import { useStore } from "@/store/useStore"
import { formatCurrency } from "@/lib/utils"

export function PrintableInvoice() {
    const { cart, quoteDetails, currentStore } = useStore()

    // Calculations (Mirroring CreateQuotePage)
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

    const totalTaxable = cartItems.reduce((sum, item) => sum + (item.netRate * item.quantity), 0);
    const totalGST = cartItems.reduce((sum, item) => sum + (item.taxAmount * item.quantity), 0);
    const labor = quoteDetails.laborCharges || 0;
    const grandTotal = totalTaxable + totalGST + labor;

    const storeName = currentStore?.name || "Prolux Lighting Concepts";
    const storeAddress = currentStore?.address || "123 Design Avenue, Creative District, NY 10012";

    return (
        <div className="hidden print:block print:w-full p-8 bg-white text-black">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{storeName}</h1>
                    <p className="text-sm max-w-[300px] whitespace-pre-wrap">{storeAddress}</p>
                    <p className="text-sm mt-1">Phone: (212) 555-0123 | Email: sales@luminaerp.com</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-semibold text-gray-700">QUOTE</h2>
                    <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Customer Details */}
            <div className="mb-8 p-4 border rounded-sm">
                <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Bill To:</h3>
                <p className="font-semibold text-lg">{quoteDetails.customerName || "Guest Customer"}</p>
                <p>{quoteDetails.customerAddress}</p>
                <p>{quoteDetails.customerPhone}</p>
            </div>

            {/* Table */}
            <table className="w-full mb-8 text-sm">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left py-2">Item</th>
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">HSN</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">MRP</th>
                        <th className="text-right py-2">Disc%</th>
                        <th className="text-right py-2">Net Rate</th>
                        <th className="text-right py-2">GST%</th>
                        <th className="text-right py-2">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {cartItems.map((item) => (
                        <tr key={item.id} className="border-b">
                            <td className="py-2 w-16">
                                <div className="relative h-10 w-10 border">
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </td>
                            <td className="py-2">
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs text-gray-500">SKU: {item.sku} | Finish: {item.finish}</p>
                            </td>
                            <td className="text-right py-2 text-gray-500">{item.hsn_code || '-'}</td>
                            <td className="text-right py-2">{item.quantity}</td>
                            <td className="text-right py-2">{formatCurrency(item.price_retail)}</td>
                            <td className="text-right py-2">{item.discount}%</td>
                            <td className="text-right py-2">{formatCurrency(item.netRate)}</td>
                            <td className="text-right py-2">{item.gst_rate}%</td>
                            <td className="text-right py-2 font-medium">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-1/3 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Total Taxable Value:</span>
                        <span>{formatCurrency(totalTaxable)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Total GST:</span>
                        <span>{formatCurrency(totalGST)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Labor/Installation:</span>
                        <span>{formatCurrency(labor)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Grand Total:</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t flex justify-between items-end">
                <div className="text-xs text-gray-500 max-w-md">
                    <p className="font-bold mb-1">Terms & Conditions:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Valid for 30 days.</li>
                        <li>50% advance required to confirm order.</li>
                        <li>Goods once sold cannot be returned.</li>
                    </ul>
                </div>
                <div className="text-center">
                    <div className="h-16 border-b border-black w-48 mb-2"></div>
                    <p className="text-sm font-semibold">Authorized Signatory</p>
                </div>
            </div>
        </div>
    )
}
