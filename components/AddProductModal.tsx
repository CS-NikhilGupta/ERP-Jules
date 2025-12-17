"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/lib/supabaseClient";
import { useStore } from "@/store/useStore";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, X } from "lucide-react";
import { Product } from "@/types";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: Product | null;
}

export function AddProductModal({ open, onOpenChange, productToEdit }: AddProductModalProps) {
  const { addProduct, updateProduct, fetchAccounts, accounts } = useStore();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form State
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Chandelier");

  // Sales
  const [priceRetail, setPriceRetail] = useState<string>(""); // MRP
  const [priceDealer, setPriceDealer] = useState<string>("");
  const [finish, setFinish] = useState("");

  // Inventory
  const [stock, setStock] = useState<string>("0");

  // Accounting / Tax
  const [hsnCode, setHsnCode] = useState("");
  const [gstRate, setGstRate] = useState<string>("18"); // Default 18
  const [costPrice, setCostPrice] = useState<string>("");
  const [incomeAccountId, setIncomeAccountId] = useState<string>("");

  // Sync prop changes
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
      if (open) {
          fetchAccounts();
      }
  }, [open, fetchAccounts]);

  if (open && !hasInitialized) {
      if (productToEdit) {
          setSku(productToEdit.sku);
          setName(productToEdit.name);
          setCategory(productToEdit.category || "Chandelier");
          setPriceRetail(productToEdit.price_retail.toString());
          setPriceDealer(productToEdit.price_dealer.toString());
          setFinish(productToEdit.finish || "");
          setImagePreview(productToEdit.imageUrl);
          setStock("0"); // Usually don't edit stock here, but maybe show current?

          setHsnCode(productToEdit.hsn_code || "");
          setGstRate(productToEdit.gst_rate?.toString() || "18");
          setCostPrice(productToEdit.cost_price?.toString() || "");
          setIncomeAccountId(productToEdit.income_account_id || "");
      } else {
          setSku("");
          setName("");
          setCategory("Chandelier");
          setPriceRetail("");
          setPriceDealer("");
          setFinish("");
          setStock("0");
          setHsnCode("");
          setGstRate("18");
          setCostPrice("");
          setIncomeAccountId("");
          setImagePreview(null);
          setImageFile(null);
      }
      setHasInitialized(true);
  }

  if (!open && hasInitialized) {
      setHasInitialized(false);
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleSave = async () => {
    if (!sku || !name || !priceRetail) {
      alert("Please fill in required fields (SKU, Name, MRP).");
      return;
    }

    setLoading(true);
    try {
        let publicUrl = productToEdit?.imageUrl || "";

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${sku}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('products')
                .getPublicUrl(fileName);

            publicUrl = urlData.publicUrl;
        }

        const productData = {
            sku,
            name,
            category,
            price_retail: parseFloat(priceRetail),
            price_dealer: parseFloat(priceDealer) || (parseFloat(priceRetail) * 0.5),
            imageUrl: publicUrl,
            finish: finish || undefined,
            hsn_code: hsnCode,
            gst_rate: parseFloat(gstRate),
            cost_price: parseFloat(costPrice) || 0,
            income_account_id: incomeAccountId || null
        };

        if (productToEdit) {
            await updateProduct(productToEdit.id, productData);
        } else {
            await addProduct(productData, parseInt(stock) || 0);
        }

        onOpenChange(false);
    } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
            alert("Error saving product: " + err.message);
        } else {
            alert("An unknown error occurred");
        }
    } finally {
        setLoading(false);
    }
  };

  const incomeAccounts = accounts.filter(a => a.type === 'income');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productToEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="accounting">Accounting</TabsTrigger>
            </TabsList>

            {/* 1. General Tab */}
            <TabsContent value="general" className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Product Image</Label>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors h-40 ${
                            isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary'
                        }`}
                    >
                        <input {...getInputProps()} />
                        {imagePreview ? (
                            <div className="relative h-full w-full flex items-center justify-center">
                                <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-0 right-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setImageFile(null);
                                        setImagePreview(null);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <Upload className="mx-auto h-8 w-8 mb-2" />
                                <p className="text-sm">Drag image or click</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="sku">SKU *</Label>
                        <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. CH-001" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                            id="category"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="Chandelier">Chandelier</option>
                            <option value="Wall Light">Wall Light</option>
                            <option value="Pendant Light">Pendant Light</option>
                            <option value="Floor Lamp">Floor Lamp</option>
                            <option value="Table Lamp">Table Lamp</option>
                        </select>
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Product Name" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="hsn">HSN Code</Label>
                        <Input id="hsn" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="1234" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gst">GST Rate (%)</Label>
                        <select
                            id="gst"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={gstRate}
                            onChange={(e) => setGstRate(e.target.value)}
                        >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                </div>
            </TabsContent>

            {/* 2. Sales Tab */}
            <TabsContent value="sales" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="priceRetail">MRP (List Price) *</Label>
                        <Input id="priceRetail" type="number" value={priceRetail} onChange={(e) => setPriceRetail(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="priceDealer">Dealer Price</Label>
                        <Input id="priceDealer" type="number" value={priceDealer} onChange={(e) => setPriceDealer(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="finish">Finish</Label>
                        <Input id="finish" value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="e.g. Gold" />
                    </div>
                </div>
            </TabsContent>

            {/* 3. Inventory Tab */}
            <TabsContent value="inventory" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="stock">Initial Stock</Label>
                        <Input
                            id="stock"
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            placeholder="0"
                            disabled={!!productToEdit} // Disable editing initial stock for existing products
                        />
                        {productToEdit && <p className="text-xs text-muted-foreground">Use Receive Stock to update.</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value="Warehouse (Default)" disabled />
                    </div>
                </div>
            </TabsContent>

            {/* 4. Accounting Tab */}
            <TabsContent value="accounting" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="costPrice">Cost Price</Label>
                        <Input id="costPrice" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="incomeAccount">Income Account</Label>
                        <select
                            id="incomeAccount"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={incomeAccountId}
                            onChange={(e) => setIncomeAccountId(e.target.value)}
                        >
                            <option value="">Select Account...</option>
                            {incomeAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : (productToEdit ? "Update Product" : "Save Product")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
