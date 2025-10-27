
'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Product } from '@/lib/mock-data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Printer, QrCode, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function QrCodeDisplay({ product }: { product: Product }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    React.useEffect(() => {
        if (canvasRef.current && product) {
            const qrCodeData = JSON.stringify({
                companyName: "bobs bath fittings pvt ltd",
                address: "UPSIDC-IA, X-18, GT Rd, Etah, Dalelpur, Uttar Pradesh 207003",
                email: "info@thebobs.in",
                productName: product.name,
                series: product.series,
                sku: product.sku
            }, null, 2);

            QRCode.toCanvas(canvasRef.current, qrCodeData, { width: 128 }, (error) => {
                if (error) console.error(error);
            });
        }
    }, [product]);

    return (
        <div className="p-2 border rounded-lg flex flex-col items-center gap-1 break-inside-avoid">
             <p className="text-xs font-semibold text-center truncate w-full">{product.name}</p>
            <canvas ref={canvasRef} className="w-full max-w-[128px] aspect-square" />
        </div>
    );
}

const PrintableQrCodes = React.forwardRef<HTMLDivElement, { products: Product[] }>(({ products }, ref) => {
    return (
        <div ref={ref} className="p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">Product QR Codes</h1>
            <div className="grid grid-cols-3 gap-4">
                {products.map(p => <QrCodeDisplay key={p.id} product={p}/>)}
            </div>
        </div>
    );
});
PrintableQrCodes.displayName = 'PrintableQrCodes';

interface QrCodeGeneratorClientProps {
    products: Product[];
}

export function QrCodeGeneratorClient({ products: initialProducts }: QrCodeGeneratorClientProps) {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});

    const printComponentRef = useRef<HTMLDivElement>(null);
    const handlePrint = () => {
        window.print();
    };

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(
            p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const handleSelectAll = useCallback((checked: boolean) => {
        const newSelected: Record<string, boolean> = {};
        if (checked) {
            filteredProducts.forEach(p => newSelected[p.id] = true);
        }
        setSelectedProducts(newSelected);
    }, [filteredProducts]);

    const handleSelectProduct = useCallback((productId: string, checked: boolean) => {
        setSelectedProducts(prev => ({ ...prev, [productId]: checked }));
    }, []);
    
    const productsToPrint = useMemo(() => {
        return products.filter(p => selectedProducts[p.id]);
    }, [products, selectedProducts]);

    const allSelected = useMemo(() => 
        filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts[p.id]),
        [filteredProducts, selectedProducts]
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><QrCode /> QR Code Generator</h1>
                    <p className="text-muted-foreground">Generate and print QR codes for your products.</p>
                </div>
                 <Button onClick={handlePrint} disabled={productsToPrint.length === 0} className="w-full sm:w-auto">
                    <Printer className="mr-2 h-4 w-4" />
                    Print Selected ({productsToPrint.length})
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Select Products</CardTitle>
                    <CardDescription>Choose the products you want to generate QR codes for.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                            placeholder="Search by name or SKU..."
                            className="pl-9 max-w-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox 
                                            checked={allSelected}
                                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>SKU</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({length: 5}).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                            <TableCell><Skeleton className="h-8" /></TableCell>
                                            <TableCell><Skeleton className="h-8" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredProducts.length > 0 ? (
                                    filteredProducts.map(product => (
                                        <TableRow key={product.id} data-state={selectedProducts[product.id] && "selected"}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedProducts[product.id] || false}
                                                    onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                                                    aria-label={`Select ${product.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>{product.sku}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="hidden">
                 <div className="print-container">
                     <PrintableQrCodes ref={printComponentRef} products={productsToPrint} />
                </div>
            </div>
             <style jsx global>{`
                @media print {
                    body > * {
                        display: none !important;
                    }
                    .print-container, .print-container * {
                        display: block !important;
                        visibility: visible !important;
                    }
                    .print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}


