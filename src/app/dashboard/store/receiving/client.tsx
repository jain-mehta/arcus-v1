
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Box } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { receiveShipment, getStoreShipments } from './actions';
import { useRouter } from 'next/navigation';
import type { Store } from '@/lib/mock-data/types';
import { Label } from '@/components/ui/label';

interface Shipment {
    id: string;
    origin: string;
    items: { productId: string, name: string, sku: string, quantity: number }[];
}

interface ProductReceivingClientProps {
    initialShipments: Shipment[];
    isAdmin: boolean;
    allStores: Store[];
    userStoreId?: string;
}

export function ProductReceivingClient({ initialShipments, isAdmin, allStores, userStoreId }: ProductReceivingClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [shipments, setShipments] = useState(initialShipments);
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(initialShipments[0] || null);
    const [isConfirming, startConfirmation] = useTransition();
    const [isLoadingShipments, startLoadingShipments] = useTransition();
    
    // For admins, the store can be selected. For regular users, it's fixed.
    const [selectedStoreId, setSelectedStoreId] = useState<string>(userStoreId || allStores[0]?.id);

    const handleStoreChange = useCallback((storeId: string) => {
        setSelectedStoreId(storeId);
        setSelectedShipment(null);
        setShipments([]);
        startLoadingShipments(async () => {
             const newShipments = await getStoreShipments(storeId);
             setShipments(newShipments);
             if (newShipments.length > 0) {
                 setSelectedShipment(newShipments[0]);
             }
        });
    }, []);

    const handleSelectShipment = (shipmentId: string) => {
        const shipment = shipments.find(s => s.id === shipmentId);
        setSelectedShipment(shipment || null);
    };

    const handleConfirmReceipt = () => {
        if (!selectedShipment || !selectedStoreId) return;

        startConfirmation(async () => {
            try {
                const result = await receiveShipment(selectedShipment.id, selectedShipment.items, selectedStoreId);
                if (result.success) {
                    toast({
                        title: "Receipt Confirmed",
                        description: `Shipment ${selectedShipment.id} has been successfully received into inventory.`
                    });
                    // Refresh the list of shipments for the current store
                    handleStoreChange(selectedStoreId);
                    router.refresh(); // To update inventory counts elsewhere
                } else {
                    throw new Error(result.message);
                }
            } catch (error: any) {
                 toast({
                    variant: 'destructive',
                    title: "Error",
                    description: error.message || 'Failed to confirm receipt.'
                });
            }
        });
    }

    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Box /> Product Receiving</h1>
                <p className="text-muted-foreground">Receive stock transfers from the factory or other stores.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Incoming Shipments</CardTitle>
                    <CardDescription>Select a store and a pending shipment to start receiving products.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    {isAdmin && (
                        <div className="w-full md:w-auto md:max-w-sm space-y-2">
                            <Label htmlFor="store-select">Store Location</Label>
                            <Select onValueChange={handleStoreChange} value={selectedStoreId}>
                                <SelectTrigger id="store-select">
                                    <SelectValue placeholder="Select a store" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allStores.map(store => (
                                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="w-full md:w-auto md:max-w-sm space-y-2">
                        <Label htmlFor="shipment-select">Pending Shipments</Label>
                        <Select onValueChange={handleSelectShipment} value={selectedShipment?.id || ''} disabled={shipments.length === 0 || isLoadingShipments}>
                            <SelectTrigger id="shipment-select">
                                <SelectValue placeholder={isLoadingShipments ? "Loading shipments..." : "Select an incoming shipment..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {shipments.map(shipment => (
                                    <SelectItem key={shipment.id} value={shipment.id}>
                                        Shipment #{shipment.id} (From: {shipment.origin}, {shipment.items.length} items)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!isLoadingShipments && shipments.length === 0 && <p className="text-sm text-muted-foreground pt-2">No pending shipments for this store.</p>}
                    </div>
                </CardContent>
            </Card>
            
            {selectedShipment && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Receive Items for Shipment #{selectedShipment.id}</CardTitle>
                        <CardDescription>Verify the quantity of items in this shipment and confirm receipt to add them to your inventory.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">Expected Quantity</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedShipment.items.map(item => (
                                <TableRow key={item.productId}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.sku}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex justify-end mt-6">
                        <Button onClick={handleConfirmReceipt} disabled={isConfirming}>
                            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Receipt
                        </Button>
                    </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


