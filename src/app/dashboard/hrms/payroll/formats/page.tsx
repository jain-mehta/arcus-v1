'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { SlidersHorizontal, Upload, FileIcon, Loader2, Sparkles, Save, Trash2, Settings } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { replicatePayslipFormat, savePayrollFormat, getPayrollFormats, deletePayrollFormat } from './actions';
import type { PayslipLayout } from './actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_MASTER_STORE } from '@/lib/placeholder-store'; 
import { PrintablePayslip } from '../printable-payslip';
import { X } from 'lucide-react';


function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

export default function PayrollFormatsPage() {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [instructions, setInstructions] = useState<string>('');
    const [isGenerating, startGeneration] = useTransition();
    const [generatedLayout, setGeneratedLayout] = useState<PayslipLayout | null>(null);
    const [savedFormats, setSavedFormats] = useState<PayslipLayout[]>([]);
    const [loadingFormats, setLoadingFormats] = useState(true);
    const { toast } = useToast();
    
    useEffect(() => {
        setLoadingFormats(true);
        getPayrollFormats().then(formats => {
            setSavedFormats(formats);
            setLoadingFormats(false);
        });
    }, []);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImagePreview(await toBase64(file));
        } else {
            setImagePreview(null);
            toast({
                variant: 'destructive',
                title: 'Invalid File Type',
                description: 'Please upload an image file (e.g., PNG, JPG).',
            });
        }
    };
    
    const handleFile = async (file: File) => {
        if (!file) return;

        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';

        if (isImage || isPdf) {
            const dataUri = await toBase64(file);
            setImagePreview(dataUri);
        } else {
            toast({
                variant: 'destructive',
                title: 'Unsupported File Type',
                description: 'Please upload a PNG, JPG, or PDF file.',
            });
        }
    };

    const clearImage = (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        e?.stopPropagation();
        setImagePreview(null);
        const fileInput = document.getElementById('payslip-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    }

    const handlePaste = (event: React.ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if(file) {
                    handleFile(file);
                }
                break;
            }
        }
    };

    const handleGenerate = () => {
        if (!imagePreview) {
            toast({ variant: 'destructive', title: 'No File Uploaded', description: 'Please upload an image of the payslip format to replicate.' });
            return;
        }
        startGeneration(async () => {
            setGeneratedLayout(null);
            try {
                const result = await replicatePayslipFormat(imagePreview, instructions);
                setGeneratedLayout(result);
                 toast({ title: 'Format Generated!', description: 'The AI has analyzed the format and generated a preview.' });
            } catch (error) {
                console.error(error);
                 toast({ variant: 'destructive', title: 'Format Generation Failed', description: 'The AI could not generate a format from the provided image.' });
            }
        });
    }

     const handleSaveFormat = async () => {
        if (!generatedLayout) return;
        
        const formatName = prompt("Enter a name for this format:", "Custom AI Format");
        if (!formatName) return;

        const result = await savePayrollFormat(formatName, generatedLayout);
        if (result.success && result.newFormat) {
            setSavedFormats(prev => [...prev, result.newFormat!]);
            toast({ title: "Format Saved!", description: `"${formatName}" has been added to your formats.`});
        } else {
            toast({ variant: 'destructive', title: "Save Failed" });
        }
    };

     const handleDeleteFormat = async (formatId: string) => {
        const result = await deletePayrollFormat(formatId);
        if (result.success) {
            setSavedFormats(prev => prev.filter(f => f.id !== formatId));
            toast({ title: "Format Deleted" });
        } else {
            toast({ variant: 'destructive', title: "Delete Failed" });
        }
    };
    
    const handleSetDefault = () => {
        toast({
            title: "Feature in Development",
            description: "Setting a default format per store is coming soon."
        });
    }

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><SlidersHorizontal /> Payroll Formats</h1>
            <p className="text-muted-foreground">Customize payslip and settlement formats using our AI-powered editor.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> AI Format Replicator</CardTitle>
                <CardDescription>Upload an image of an existing payslip, and our AI will attempt to replicate its structure and fields.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8" onPaste={handlePaste}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="payslip-upload">1. Upload Existing Payslip Image</Label>
                        <div className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                            {imagePreview ? (
                              <div className='relative w-full h-full p-4 flex items-center justify-center'>
                                    <Image src={imagePreview} alt="Payslip preview" layout="fill" className="object-contain" />
                                <Button 
                                    variant="destructive" size="icon" 
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={clearImage}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <label htmlFor="payslip-upload" className='flex flex-col items-center justify-center pt-5 pb-6 text-center w-full h-full'>
                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span>, drag and drop, or paste image</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, or PDF</p>
                              </label>
                            )}
                            <Input id="payslip-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </div>
                    </div>
                    <div className="space-y-2">
                         <Label>2. Add Specific Instructions (Optional)</Label>
                        <Textarea 
                            placeholder="e.g., 'Ensure the company logo is on the top left. Add a 'Paid Days' field. The deductions section should be on the right.'" 
                            rows={4}
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={!imagePreview || isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate New Format
                    </Button>
                </div>
                 <div className="space-y-4">
                     <div className="flex justify-between items-center">
                         <Label>3. Generated Preview</Label>
                          {generatedLayout && (
                            <Button onClick={handleSaveFormat} size="sm">
                                <Save className="mr-2" />
                                Save Generated Format
                            </Button>
                        )}
                     </div>
                    <div className="h-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 p-4 min-h-[500px]">
                         {isGenerating ? (
                            <div className="text-center text-muted-foreground">
                                <Loader2 className="h-10 w-10 animate-spin" />
                                <p className="mt-2">AI is analyzing the format...</p>
                            </div>
                        ) : generatedLayout ? (
                           <GeneratedPayslipPreview layout={generatedLayout} />
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <FileIcon className="h-12 w-12 mx-auto" />
                                <p className="mt-2">The AI-generated format preview will appear here.</p>
                            </div>
                        )}
                    </div>
                 </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Saved Payroll Formats</CardTitle>
                <CardDescription>Manage your custom and pre-built payslip formats.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Format Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingFormats ? <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow> :
                        savedFormats.map(format => (
                            <TableRow key={format.id}>
                                <TableCell className="font-medium">{format.name}</TableCell>
                                <TableCell>Custom</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" onClick={handleSetDefault}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Set as Default
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteFormat(format.id!)} className="text-destructive hover:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {savedFormats.length === 0 && !loadingFormats && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No custom formats have been saved yet.
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

function GeneratedPayslipPreview({ layout }: { layout: PayslipLayout }) {
    const mockPayslip: any = {
        staffName: "Employee Name",
        staffId: "EMP001",
        month: "Month Year",
        grossSalary: 0, // Will be calculated
        deductions: 0, // Will be calculated
        netSalary: 0, // Will be calculated
        components: layout.body.sections.flatMap(s => s.fields.map(f => ({
            name: f.label,
            type: s.title.toLowerCase().includes('earning') ? 'Earning' : 'Deduction',
            value: parseFloat(f.exampleValue.replace(/[^0-9.]/g, '') || '0'),
            calculationType: 'Fixed',
        })))
    };
    
    mockPayslip.grossSalary = mockPayslip.components
        .filter((c: any) => c.type === 'Earning')
        .reduce((sum: number, c: any) => sum + c.value, 0);

    mockPayslip.deductions = mockPayslip.components
        .filter((c: any) => c.type === 'Deduction')
        .reduce((sum: number, c: any) => sum + c.value, 0);

    mockPayslip.netSalary = mockPayslip.grossSalary - mockPayslip.deductions;
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="w-full max-w-md bg-white text-black p-4 shadow-lg font-sans cursor-pointer hover:shadow-xl transition-shadow">
                    <PrintablePayslip 
                        layout={layout} 
                        payslip={mockPayslip}
                        store={MOCK_MASTER_STORE} 
                    />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                 <DialogHeader>
                    <DialogTitle>Payslip Format Preview</DialogTitle>
                    <DialogDescription>A full-size preview of the generated format.</DialogDescription>
                </DialogHeader>
                 <div className="p-4 bg-muted overflow-auto">
                     <div className="w-full bg-white text-black p-4 shadow-lg font-sans">
                        <PrintablePayslip 
                            layout={layout} 
                            payslip={mockPayslip}
                            store={MOCK_MASTER_STORE} 
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

