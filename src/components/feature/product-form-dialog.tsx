'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Product } from '@/lib/mock-data/types';
import Image from 'next/image';

const imageFileSchema = z.object({
    base64: z.string(),
    type: z.string(),
}).optional();


const formSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters.'),
  sku: z.string().min(1, 'SKU is required.'),
  brand: z.enum(['Bobs', 'Buick']),
  series: z.enum(['Solo', 'Galaxy', 'Cubix-B', 'Other']),
  category: z.string().min(1, 'Category is required.'),
  subcategory: z.string().optional(),
  unit: z.string().min(1, 'Unit of measurement is required.'),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  reorderLevel: z.coerce.number().int().min(0).optional(),
  safetyStock: z.coerce.number().int().min(0).optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  imageFile: imageFileSchema,
  imageUrl: z.string().optional(), // Keep imageUrl for display
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormDialogProps {
  formTitle: string;
  triggerButton: React.ReactNode;
  product?: Product;
  onSave: (data: any) => Promise<void>;
  isSaving: boolean;
  inventoryType: 'Factory' | 'Store';
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}


export function ProductFormDialog({
  formTitle,
  triggerButton,
  product,
  onSave,
  isSaving,
  inventoryType,
}: ProductFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!product;
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);


  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          series: product.series,
          category: product.category,
          subcategory: product.subcategory || '',
          unit: product.unit,
          price: product.price || 0,
          imageUrl: product.imageUrl || '',
          reorderLevel: product.reorderLevel || 0,
          safetyStock: product.safetyStock || 0,
          quantity: product.quantity || 0,
        }
      : {
          name: '',
          sku: '',
          brand: 'Bobs',
          series: 'Solo',
          category: '',
          subcategory: '',
          unit: 'piece',
          price: 0,
          imageUrl: '',
          reorderLevel: 10,
          safetyStock: 5,
          quantity: 0,
        },
  });

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      form.setValue('imageFile', { base64, type: file.type }, { shouldValidate: true });
      setImagePreview(base64);
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    const dataToSave: Partial<Product> & { quantity?: number, imageFile?: { base64: string, type: string } } = {
      ...values,
      inventoryType: product?.inventoryType || inventoryType,
    };
    await onSave(dataToSave);
    if (!isEditMode) { // Only reset for new products
      form.reset();
      setImagePreview(null);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{formTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Brass Faucet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., BFB-001" {...field} disabled={isEditMode}/>
                    </FormControl>
                    {isEditMode && (
                        <FormDescription>
                            SKU cannot be changed after a product is created.
                        </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Taps" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kitchen Taps" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Bobs">Bobs</SelectItem>
                            <SelectItem value="Buick">Buick</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="series"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Series</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select series" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Solo">Solo</SelectItem>
                          <SelectItem value="Galaxy">Galaxy</SelectItem>
                          <SelectItem value="Cubix-B">Cubix-B</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <FormField
                control={form.control}
                name="imageFile"
                render={() => (
                <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-4">
                            {imagePreview && <Image src={imagePreview} alt="Product preview" width={64} height={64} className="rounded-md object-cover" />}
                            <Input id="image-file-upload" type="file" onChange={handleImageFileChange} className="max-w-xs" accept="image/*" />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., piece" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (?)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="reorderLevel"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Reorder Level</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g. 50" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="safetyStock"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Safety Stock</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g. 10" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            {!isEditMode && <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Initial Stock</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="e.g. 100" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />}


            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Product
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


