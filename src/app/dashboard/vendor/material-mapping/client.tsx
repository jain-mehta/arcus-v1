
'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Trash2, Save, Loader2 } from "lucide-react";
import { AddMappingDialog } from "./components/add-mapping-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { updateMaterialMappings, deleteMaterialMapping, addMaterialMapping, addVolumeDiscount, updateVolumeDiscounts, deleteVolumeDiscount, getMaterialMappings, getVolumeDiscounts } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AddDiscountDialog } from './components/add-discount-dialog';

type EditableMaterialMapping = any & { isDirty?: boolean };
type EditableVolumeDiscount = any & { isDirty?: boolean };

interface MaterialMappingClientProps {
    vendors: Vendor[];
    initialMappings: EditableMaterialMapping[];
    initialDiscounts: EditableVolumeDiscount[];
    initialSelectedVendorId: string | null;
}

export function MaterialMappingClient({ vendors, initialMappings, initialDiscounts, initialSelectedVendorId }: MaterialMappingClientProps) {
    const { toast } = useToast();
    const [selectedVendor, setSelectedVendor] = useState<string>(initialSelectedVendorId || '');
    const [mappings, setMappings] = useState<EditableMaterialMapping[]>(initialMappings);
    const [initialMappingsState, setInitialMappingsState] = useState<EditableMaterialMapping[]>(initialMappings);
    const [selectedMappingId, setSelectedMappingId] = useState<string | null>(initialMappings[0]?.id || null);
    const [discounts, setDiscounts] = useState<EditableVolumeDiscount[]>(initialDiscounts);
    const [initialDiscountsState, setInitialDiscountsState] = useState<EditableVolumeDiscount[]>(initialDiscounts);
    const [loadingMappings, setLoadingMappings] = useState(false);
    const [loadingDiscounts, setLoadingDiscounts] = useState(false);
    const [isSaving, startSaving] = useTransition();

    useEffect(() => {
        if (selectedVendor && selectedVendor !== initialSelectedVendorId) {
            const fetchMappings = async () => {
                setLoadingMappings(true);
                try {
                    const mappingResult = await getMaterialMappings(selectedVendor);
                    const mappingData = mappingResult.success ? ((mappingResult.data as any) || []) : [];
                    setMappings(mappingData);
                    setInitialMappingsState(mappingData);
                    if ((mappingData as any).length > 0) {
                        setSelectedMappingId((mappingData as any)[0].id);
                    } else {
                        setSelectedMappingId(null);
                    }
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to load material mappings.' });
                } finally {
                    setLoadingMappings(false);
                }
            }
            fetchMappings();
        } else if (!selectedVendor) {
            setMappings([]);
            setInitialMappingsState([]);
            setSelectedMappingId(null);
        }
    }, [selectedVendor, initialSelectedVendorId, toast]);

    useEffect(() => {
        if (selectedMappingId) {
            const fetchDiscounts = async () => {
                setLoadingDiscounts(true);
                try {
                    const discountResult = await getVolumeDiscounts(selectedMappingId);
                    const discountData = discountResult.success ? ((discountResult.data as any) || []) : [];
                    setDiscounts(discountData);
                    setInitialDiscountsState(discountData);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to load volume discounts.' });
                } finally {
                    setLoadingDiscounts(false);
                }
            }
            fetchDiscounts();
        } else {
            setDiscounts([]);
            setInitialDiscountsState([]);
        }
    }, [selectedMappingId, toast]);

    const handleMappingFieldChange = (mappingId: string, field: string, value: any) => {
        setMappings(prev =>
            prev.map(m => {
                if (m.id === mappingId) {
                    const updatedMapping = { ...m, [field]: value };
                    const initialMapping = initialMappingsState.find(im => im.id === mappingId);
                    const isDirty = JSON.stringify({ ...initialMapping, isDirty: undefined }) !== JSON.stringify({ ...updatedMapping, isDirty: undefined });
                    return { ...updatedMapping, isDirty };
                }
                return m;
            })
        );
    };

    const handleDiscountFieldChange = (discountId: string, field: string, value: any) => {
        setDiscounts(prev =>
            prev.map(d => {
                if (d.id === discountId) {
                    const updatedDiscount = { ...d, [field]: value };
                    const initialDiscount = initialDiscountsState.find(id => id.id === discountId);
                    const isDirty = JSON.stringify({ ...initialDiscount, isDirty: undefined }) !== JSON.stringify({ ...updatedDiscount, isDirty: undefined });
                    return { ...updatedDiscount, isDirty };
                }
                return d;
            })
        );
    };

    const hasDirtyChanges = useMemo(() => {
        return mappings.some(m => m.isDirty) || discounts.some(d => d.isDirty);
    }, [mappings, discounts]);

    const handleSaveChanges = () => {
        const mappingUpdates = mappings.filter(m => m.isDirty).map(({ isDirty, ...rest }) => rest);
        const discountUpdates = discounts.filter(d => d.isDirty).map(({ isDirty, ...rest }) => rest);
        
        if (mappingUpdates.length === 0 && discountUpdates.length === 0) {
            toast({ title: 'No changes to save.' });
            return;
        }

        startSaving(async () => {
            try {
                const promises = [];
                if(mappingUpdates.length > 0) promises.push(updateMaterialMappings(mappingUpdates));
                if(discountUpdates.length > 0) promises.push(updateVolumeDiscounts(discountUpdates));
                await Promise.all(promises);
                
                setMappings(mappings.map(m => ({ ...m, isDirty: false })));
                setInitialMappingsState(mappings.map(m => ({ ...m, isDirty: false })));
                setDiscounts(discounts.map(d => ({ ...d, isDirty: false })));
                setInitialDiscountsState(discounts.map(d => ({ ...d, isDirty: false })));

                toast({ title: 'Success', description: 'All changes have been saved.' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to save changes.' });
            }
        });
    };
    
    // Other handlers like handleDeleteMapping, handleAddMapping, etc. remain the same
    const handleDeleteMapping = (mappingId: string) => {
        startSaving(async () => {
            try {
                await deleteMaterialMapping(mappingId);
                const newMappings = mappings.filter(m => m.id !== mappingId);
                setMappings(newMappings);
                setInitialMappingsState(newMappings);
                if (selectedMappingId === mappingId) {
                    setSelectedMappingId(newMappings.length > 0 ? newMappings[0].id : null);
                }
                toast({ title: 'Success', description: 'Material mapping deleted.' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete mapping.' });
            }
        });
    };
    
    const handleAddMapping = async (data: any) => {
        if (!selectedVendor) return false;
        try {
            const newMappingId = await addMaterialMapping(selectedVendor, data);
            const newMapping = { ...data, id: newMappingId, vendorId: selectedVendor, active: true };
            const newMappings = [newMapping, ...mappings];
            setMappings(newMappings);
            setInitialMappingsState(newMappings);
            toast({ title: 'Success', description: 'New material mapping added.'});
            return true;
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add mapping.' });
            return false;
        }
    };
    
    const handleAddDiscount = async (data: any) => {
        if (!selectedMappingId) return false;
        try {
            const newDiscountId = await addVolumeDiscount({ ...data, mapping_id: selectedMappingId });
            const newDiscount = { ...data, id: newDiscountId, mapping_id: selectedMappingId };
            setDiscounts(prev => [...prev, newDiscount]);
            setInitialDiscountsState(prev => [...prev, newDiscount]);
            toast({ title: 'Success', description: 'New volume discount added.' });
            return true;
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to add discount.' });
            return false;
        }
    };

    const handleDeleteDiscount = (discountId: string) => {
        startSaving(async () => {
            try {
                await deleteVolumeDiscount(discountId);
                const newDiscounts = discounts.filter(d => d.id !== discountId);
                setDiscounts(newDiscounts);
                setInitialDiscountsState(newDiscounts);
                toast({ title: 'Success', description: 'Volume discount deleted.' });
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete discount.' });
            }
        });
    };


    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Raw Material Catalog Mapping</h1>
                    <p className="text-muted-foreground">Manage material-to-vendor associations, pricing, and reorder levels.</p>
                </div>
                <Button size="lg" onClick={handleSaveChanges} disabled={isSaving || !hasDirtyChanges}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save All Changes
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Vendor</CardTitle>
                    <CardDescription>Choose a vendor to view or edit their material mappings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='max-w-sm'>
                        <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                            <SelectTrigger>
                                <SelectValue placeholder={vendors.length > 0 ? "Select a vendor" : "No vendors available"} />
                            </SelectTrigger>
                            <SelectContent>
                                {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Material Mappings for {vendors.find(v => v.id === selectedVendor)?.name || '...'}</CardTitle>
                        <CardDescription>Below is the list of materials supplied by the selected vendor. Click a row to manage volume discounts.</CardDescription>
                    </div>
                    <AddMappingDialog onAddMapping={handleAddMapping} disabled={!selectedVendor}/>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Unit Price (?)</TableHead>
                                <TableHead>Reorder Level</TableHead>
                                <TableHead>Safety Stock</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingMappings ? (
                                Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8"/></TableCell></TableRow>
                                ))
                            ) : mappings.length > 0 ? (
                                mappings.map((mapping) => (
                                    <TableRow 
                                        key={mapping.id} 
                                        className={cn(
                                            'cursor-pointer',
                                            mapping.isDirty && 'bg-yellow-100/50 dark:bg-yellow-900/20',
                                            selectedMappingId === mapping.id && 'bg-muted hover:bg-muted'
                                        )}
                                        onClick={() => setSelectedMappingId(mapping.id)}
                                    >
                                        <TableCell className="font-medium">{mapping.material}</TableCell>
                                        <TableCell>{mapping.sku}</TableCell>
                                        <TableCell>{mapping.unit}</TableCell>
                                        <TableCell>
                                            <Input type="number" value={mapping.unitPrice} onChange={e => handleMappingFieldChange(mapping.id, 'unitPrice', parseFloat(e.target.value))} className="w-28" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={mapping.reorderLevel} onChange={e => handleMappingFieldChange(mapping.id, 'reorderLevel', parseInt(e.target.value))} className="w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={mapping.safetyStock} onChange={e => handleMappingFieldChange(mapping.id, 'safetyStock', parseInt(e.target.value))} className="w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <Switch checked={mapping.active} onCheckedChange={c => handleMappingFieldChange(mapping.id, 'active', c)} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the material mapping for {mapping.material}.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteMapping(mapping.id)} className={cn(buttonVariants({variant: 'destructive'}))}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No material mappings found for this vendor.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Volume Discounts</CardTitle>
                        <CardDescription>Define pricing tiers for <strong className='text-foreground'>{mappings.find(m => m.id === selectedMappingId)?.material || '...'}</strong></CardDescription>
                    </div>
                    <AddDiscountDialog onAdd={handleAddDiscount} disabled={!selectedMappingId} />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Min Quantity</TableHead>
                                <TableHead>Discount (%)</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingDiscounts ? (
                                <TableRow><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>
                            ) : discounts.length > 0 ? (
                                discounts.map((discount) => (
                                     <TableRow key={discount.id} className={cn(discount.isDirty && 'bg-yellow-100/50 dark:bg-yellow-900/20')}>
                                        <TableCell>
                                            <Input type="number" value={discount.minQuantity} onChange={e => handleDiscountFieldChange(discount.id, 'minQuantity', parseInt(e.target.value))} className="w-32" />
                                        </TableCell>
                                         <TableCell>
                                            <Input type="number" value={discount.discount} onChange={e => handleDiscountFieldChange(discount.id, 'discount', parseFloat(e.target.value))} className="w-32" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteDiscount(discount.id)} disabled={isSaving}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
                                        No volume discounts configured. Select a material and add one.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
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

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
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
