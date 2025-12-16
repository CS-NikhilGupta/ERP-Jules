"use client";

import { useState, useCallback } from "react";
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
import { Upload, X } from "lucide-react";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductModal({ open, onOpenChange }: AddProductModalProps) {
  const { addProduct } = useStore();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form State
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Chandelier");
  const [price, setPrice] = useState<string>("");
  const [stock, setStock] = useState<string>("0");
  const [finish, setFinish] = useState("");

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
    if (!sku || !name || !price) {
      alert("Please fill in all required fields (SKU, Name, Price).");
      return;
    }
    if (!imageFile) {
        alert("Please upload an image.");
        return;
    }

    setLoading(true);
    try {
        // 1. Upload Image
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${sku}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(fileName);

        // 2. Add Product to DB
        await addProduct({
            sku,
            name,
            category,
            price_retail: parseFloat(price),
            imageUrl: publicUrl,
            finish: finish || undefined
        }, parseInt(stock) || 0);

        // Reset
        setImageFile(null);
        setImagePreview(null);
        setSku("");
        setName("");
        setPrice("");
        setStock("0");
        setFinish("");

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
            {/* Section A: Image Drop Zone */}
            <div className="space-y-2">
                <Label>Product Image</Label>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors h-48 ${
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
                            <p>Drag & drop an image here, or click to select</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Section B: Details */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. CH-001" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                        id="category"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <Label htmlFor="price">MRP (Price) *</Label>
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="stock">Initial Stock</Label>
                    <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="finish">Finish</Label>
                    <Input id="finish" value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="e.g. Gold" />
                </div>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
