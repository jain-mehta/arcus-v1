
'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { EllipsisVertical, PlusCircle, Search, Trash2, Edit, ShoppingCart, Info, Store } from 'lucide-react';
import { ProductFormDialog } from './product-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';


interface ProductTableProps {
  products: Product[];
  stores: any[];
  inventoryType?: 'Factory' | 'Store';
  showTypeColumn?: boolean;
  showSimulateSale?: boolean;
  addProduct: (data: Omit<Product, 'id' | 'orgId'>) => Promise<any>;
  updateProduct: (id: string, data: Partial<Omit<Product, 'id'>>) => Promise<any>;
  deleteProduct: (id: string) => Promise<any>;
  simulateSale: (id: string) => Promise<any>;
}

export function ProductTable({ 
    products: initialProducts, 
    stores,
    inventoryType = 'Factory', 
    showTypeColumn = true, 
    showSimulateSale = true,
    addProduct,
    updateProduct,
    deleteProduct,
    simulateSale
}: ProductTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);
  
  const storeMap = useMemo(() => new Map(stores.map(s => [s.id, s.name])), [stores]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        ((product as any).name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((product as any).sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((product as any).category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((product as any).brand && (product as any).brand.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [products, searchTerm]);

  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc: any, product: any) => {
      const series = (product as any).series || 'Other';
      if (!acc[series]) {
        acc[series] = [];
      }
      acc[series].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [filteredProducts]);

  const handleAddProduct = async (data: Omit<Product, 'id'>) => {
    startTransition(async () => {
      const result = await addProduct(data);
       if (result.success) {
        toast({ title: 'Success', description: 'Product added successfully.' });
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleUpdateProduct = async (id: string, data: Partial<Omit<Product, 'id'>>) => {
    startTransition(async () => {
      const result = await updateProduct(id, data);
      if (result.success) {
        toast({ title: 'Success', description: 'Product updated successfully.' });
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleDeleteProduct = async (id: string) => {
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.success) {
        toast({ title: 'Success', description: 'Product deleted successfully.' });
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };
  
  const handleSimulateSale = async (id: string) => {
    startTransition(async () => {
        const result = await simulateSale(id);
        if (result.success) {
            toast({ title: 'Sale Simulated', description: 'Product stock decremented by 1.' });
            router.refresh();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  };

  return (
    <>
    <Card>
      <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <CardTitle>Product List</CardTitle>
            <CardDescription>Products are grouped by series. Expand a series to see its products.</CardDescription>
        </div>
         <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all products..."
                className="pl-9 w-full sm:w-auto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ProductFormDialog
              formTitle="Add New Product"
              triggerButton={
                <Button>
                  <PlusCircle /> Add Product
                </Button>
              }
              onSave={handleAddProduct}
              isSaving={isPending}
              inventoryType={inventoryType}
            />
         </div>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedProducts).length > 0 ? (
          <Accordion type="multiple" defaultValue={Object.keys(groupedProducts)} className="w-full space-y-4">
            {Object.entries(groupedProducts as Record<string, any[]>).map(([series, products]: [string, any[]]) => (
              <AccordionItem value={series} key={series} className="border-b-0">
                <Card>
                <AccordionTrigger className="p-4 hover:no-underline text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{series} Series</h3>
                    <Badge variant="secondary">{(products as any).length} products</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="border-t">
                      <Table>
                      <TableHeader>
                          <TableRow>
                          <TableHead className="w-16">Image</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">SKU</TableHead>
                          <TableHead>Brand</TableHead>
                          {showTypeColumn && <TableHead className="hidden sm:table-cell">Location</TableHead>}
                          <TableHead>Current Stock</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                           <TableRow key={product.id}>
                              <TableCell>
                                  <Image 
                                      src={product.imageUrl || "https://picsum.photos/seed/product/40/40"} 
                                      alt={product.name}
                                      width={40}
                                      height={40}
                                      className="rounded-md object-cover"
                                      data-ai-hint="product image"
                                  />
                              </TableCell>
                              <TableCell className="font-medium flex items-center gap-2">
                                  {product.name}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{product.sku}</TableCell>
                              <TableCell>{product.brand}</TableCell>
                              {showTypeColumn && <TableCell className="hidden sm:table-cell">
                                  <Badge variant={product.inventoryType === 'Factory' ? 'secondary' : 'outline'} className="gap-1.5">
                                      {product.inventoryType === 'Store' && <Store className="h-3 w-3" />}
                                      {product.inventoryType === 'Factory' ? 'Factory' : storeMap.get(product.storeId!) || 'Store'}
                                  </Badge>
                              </TableCell>}
                              <TableCell>
                                  <Badge variant={product.quantity > (product.reorderLevel || 0) ? 'outline' : 'destructive'}>
                                      {product.quantity} {product.unit}
                                  </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                  <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
                                      <span className="sr-only">Open menu</span>
                                      <EllipsisVertical />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      {showSimulateSale && (
                                        <>
                                            <DropdownMenuItem onClick={() => handleSimulateSale(product.id)}>
                                                <ShoppingCart /> Simulate Sale
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                      )}
                                      <ProductFormDialog
                                          formTitle="Edit Product"
                                          triggerButton={<DropdownMenuItem onSelect={e => e.preventDefault()}><Edit />Edit</DropdownMenuItem>}
                                          product={product}
                                          onSave={(data) => handleUpdateProduct(product.id, data)}
                                          isSaving={isPending}
                                          inventoryType={inventoryType}
                                      />
                                      <DropdownMenuSeparator />
                                      <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                          <DropdownMenuItem
                                          className="text-destructive"
                                          onSelect={(e) => e.preventDefault()}
                                          >
                                          <Trash2 />
                                          Delete
                                          </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                          <AlertDialogHeader>
                                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                              This action cannot be undone. This will permanently delete the product "{product.name}".
                                          </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                              onClick={() => handleDeleteProduct(product.id)}
                                              className={cn(buttonVariants({ variant: 'destructive' }))}
                                          >
                                              Delete
                                          </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                      </AlertDialog>
                                  </DropdownMenuContent>
                                  </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                      </Table>
                  </div>
                </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-16 border-2 border-dashed rounded-lg">
                <Info className="w-12 h-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                    {searchTerm ? "No products found for your search." : "No products have been added yet."}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm ? "Try a different search term or clear the search." : "Get started by adding a new product."}
                </p>
                 {!searchTerm && <ProductFormDialog
                    formTitle="Add New Product"
                    triggerButton={
                      <Button className="mt-4">
                        <PlusCircle /> Add Product
                      </Button>
                    }
                    onSave={handleAddProduct}
                    isSaving={isPending}
                    inventoryType={inventoryType}
                  />}
            </div>
          )
        }
      </CardContent>
    </Card>
    </>
  );
}




// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  po_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'completed';
  total_amount: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
