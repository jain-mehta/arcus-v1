

'use client';

import { useState, useTransition, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, View } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteStore } from "./actions";
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface StoreListProps {
    initialStores: Store[];
    storeManagers: User[];
}

export function StoreList({ initialStores, storeManagers }: StoreListProps) {
    const { toast } = useToast();
    const [stores, setStores] = useState<Store[]>(initialStores);
    const [isDeleting, startDeleteTransition] = useTransition();

    const [regionFilter, setRegionFilter] = useState('all');
    const [stateFilter, setStateFilter] = useState('all');
    const [showAlertsOnly, setShowAlertsOnly] = useState(false);

    const managerMap = new Map(storeManagers.map(m => [m.id, m.name]));

    const uniqueRegions = useMemo(() => [...new Set(initialStores.map(s => s.region))], [initialStores]);
    const uniqueStates = useMemo(() => [...new Set(initialStores.map(s => s.state))], [initialStores]);

    const filteredStores = useMemo(() => {
        return stores.filter(store => {
            const regionMatch = regionFilter === 'all' || store.region === regionFilter;
            const stateMatch = stateFilter === 'all' || store.state === stateFilter;
            const alertMatch = !showAlertsOnly || ((store.cashAlertThreshold || 0) > 0 && (store.cashInHand || 0) > (store.cashAlertThreshold || 0));
            return regionMatch && stateMatch && alertMatch;
        });
    }, [stores, regionFilter, stateFilter, showAlertsOnly]);


    const handleDelete = (id: string) => {
        startDeleteTransition(async () => {
            const result = await deleteStore(id);
            if (result.success) {
                setStores(prev => prev.filter(s => s.id !== id));
                toast({ title: "Store Deleted" });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    return (
        <TooltipProvider>
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="region-filter">Region</Label>
                        <Select value={regionFilter} onValueChange={setRegionFilter}>
                            <SelectTrigger id="region-filter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Regions</SelectItem>
                                {uniqueRegions.map((region, index) => <SelectItem key={`${region}-${index}`} value={region || 'unknown'}>{region || 'Unknown'}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="state-filter">State</Label>
                        <Select value={stateFilter} onValueChange={setStateFilter}>
                            <SelectTrigger id="state-filter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All States</SelectItem>
                                 {uniqueStates.map((state, index) => <SelectItem key={`${state}-${index}`} value={state || 'unknown'}>{state || 'Unknown'}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end pb-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="alert-filter" checked={showAlertsOnly} onCheckedChange={(checked) => setShowAlertsOnly(Boolean(checked))} />
                            <Label htmlFor="alert-filter">Show Cash Alerts Only</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Store Name</TableHead>
                            <TableHead>Manager</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Cash In Hand (?)</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStores.length > 0 ? filteredStores.map(store => (
                            <TableRow key={store.id}>
                                <TableCell className="font-medium">{store.name}</TableCell>
                                <TableCell>
                                    {store.managerId ? <Badge variant="outline">{managerMap.get(store.managerId) || 'Unknown'}</Badge> : 'Unassigned'}
                                </TableCell>
                                <TableCell>{store.region}</TableCell>
                                <TableCell>{store.city}, {store.state}</TableCell>
                                <TableCell className="text-right">
                                    {(store.cashInHand || 0).toLocaleString('en-IN')}
                                    {(store.cashAlertThreshold || 0) > 0 && (store.cashInHand || 0) > (store.cashAlertThreshold || 0) && <Badge variant="destructive" className="ml-2">Alert</Badge>}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/dashboard/store/profile/${store.id}`}><View className="h-4 w-4" /></Link>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>View Store Details</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isDeleting}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete the store "{store.name}".</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(store.id)}>
                                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No stores found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </TooltipProvider>
    )
}



// Database types for Supabase tables
interface User {
  id: string;
  email?: string;
  name?: string;
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
  city?: string;
  state?: string;
  region?: string;
  managerId?: string;
  manager_id?: string;
  cashInHand?: number;
  cashAlertThreshold?: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
