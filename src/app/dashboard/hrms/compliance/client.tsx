

'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { File as FileIcon, Upload, Loader2, Download, Trash2, User, Building, BookCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadComplianceDocument, deleteComplianceDocument } from './actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const documentSchema = z.object({
    name: z.string().min(3, "Document name is required."),
    category: z.enum(['Statutory', 'Policy', 'Form', 'Offer Letter', 'Payslip', 'Other']),
    file: z.instanceof(globalThis.File).refine(file => file.size > 0, 'A file is required.'),
});
type DocumentFormValues = z.infer<typeof documentSchema>;


export function HrmsComplianceClient({ initialDocuments, isAdmin }: { initialDocuments: any[], isAdmin: boolean }) {
    const { toast } = useToast();
    const [documents, setDocuments] = useState(initialDocuments);
    const [isDeleting, startDelete] = useTransition();

    const onDocumentUploaded = (newDoc: any) => {
        setDocuments(prev => [newDoc, ...prev]);
    }

    const handleDelete = async (docId: string, filePath: string) => {
        startDelete(async () => {
            const result = await deleteComplianceDocument(docId, filePath);
            if(result.success) {
                setDocuments(prev => prev.filter(d => d.id !== docId));
                toast({ title: "Document Deleted" });
            } else {
                 toast({ variant: 'destructive', title: "Error", description: result.message });
            }
        });
    }
    
    const { myDocuments, companyDocuments, statutoryDocuments } = useMemo(() => {
        const myDocs: any[] = [];
        const companyDocs: any[] = [];
        const statutoryDocs: any[] = [];

        documents.forEach(doc => {
            if (['Offer Letter', 'Payslip'].includes(doc.category)) {
                myDocs.push(doc);
            } else if (['Policy', 'Form', 'Other'].includes(doc.category)) {
                companyDocs.push(doc);
            } else if (doc.category === 'Statutory') {
                statutoryDocs.push(doc);
            }
        });
        return { myDocuments: myDocs, companyDocuments: companyDocs, statutoryDocuments: statutoryDocs };
    }, [documents]);


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <FileIcon /> Documents & Compliance
                </h1>
                <p className="text-muted-foreground">
                    Manage statutory compliance documents, company policies, and view your personal HR documents.
                </p>
            </div>

            <Tabs defaultValue="my-documents" className="space-y-8">
                 <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="my-documents"><User className='mr-2' /> My Documents</TabsTrigger>
                    <TabsTrigger value="company-documents"><Building className='mr-2' /> Company Documents</TabsTrigger>
                    <TabsTrigger value="compliance-reports"><BookCopy className='mr-2' /> Compliance Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="my-documents">
                     <Card>
                        <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>My Personal Documents</CardTitle>
                                <CardDescription>Your personal documents like payslips and offer letters.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <DocumentTable documents={myDocuments} isAdminView={false} onDelete={handleDelete} isDeleting={isDeleting} />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="company-documents">
                    <Card>
                        <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Company Document Repository</CardTitle>
                                <CardDescription>A central place for all HR policies and forms.</CardDescription>
                            </div>
                           {isAdmin && <UploadDocumentDialog onDocumentUploaded={onDocumentUploaded} />}
                        </CardHeader>
                        <CardContent>
                             <DocumentTable documents={companyDocuments} isAdminView={isAdmin} onDelete={handleDelete} isDeleting={isDeleting} />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="compliance-reports">
                    <Card>
                        <CardHeader>
                            <CardTitle>Statutory Compliance Reports</CardTitle>
                            <CardDescription>Generate and download monthly compliance reports like PF and ESI challans.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className='p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                                <div>
                                    <h3 className='font-semibold'>PF Electronic Challan-cum-Return (ECR)</h3>
                                    <p className='text-sm text-muted-foreground'>Generate the monthly PF contribution report for ECR filing.</p>
                                </div>
                                <Button variant="outline" asChild>
                                    <a href={statutoryDocuments.find(d => d.name.includes('PF ECR'))?.fileUrl} download={statutoryDocuments.find(d => d.name.includes('PF ECR'))?.fileName}>
                                        <Download className='mr-2' /> Generate & Download
                                    </a>
                                </Button>
                            </div>
                             <div className='p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                                <div>
                                    <h3 className='font-semibold'>ESI Contribution List</h3>
                                    <p className='text-sm text-muted-foreground'>Generate the monthly ESI contribution list for all applicable employees.</p>
                                </div>
                                <Button variant="outline" asChild>
                                      <a href={statutoryDocuments.find(d => d.name.includes('ESI'))?.fileUrl} download={statutoryDocuments.find(d => d.name.includes('ESI'))?.fileName}>
                                        <Download className='mr-2' /> Generate & Download
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                         <CardFooter>
                            <p className="text-xs text-muted-foreground">Note: Report generation is a simulation. The system will download pre-generated mock documents.</p>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function DocumentTable({ documents, isAdminView, onDelete, isDeleting }: { documents: any[], isAdminView: boolean, onDelete: (id: string, path: string) => void, isDeleting: boolean }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {documents.length > 0 ? documents.map(doc => (
                    <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell><Badge variant="outline">{doc.category}</Badge></TableCell>
                        <TableCell>{new Date(doc.uploadDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" asChild>
                                <a href={doc.fileUrl} download={doc.fileName}><Download className="mr-2 h-4 w-4" /> Download</a>
                            </Button>
                            {isAdminView && (
                                <Button variant="destructive" size="sm" onClick={() => onDelete(doc.id, doc.filePath)} disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                     Delete
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">No documents found in this section.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

function UploadDocumentDialog({ onDocumentUploaded }: { onDocumentUploaded: (doc: any) => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isUploading, startUpload] = useTransition();
    
    const form = useForm<DocumentFormValues>({
        resolver: zodResolver(documentSchema),
        defaultValues: { category: 'Policy' }
    });
    
    const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });

    const handleSubmit = async (values: DocumentFormValues) => {
        startUpload(async () => {
            try {
                const fileBase64 = await toBase64(values.file);
                const result = await uploadComplianceDocument(values, fileBase64);
                if (result.success && result.newDoc) {
                    onDocumentUploaded(result.newDoc);
                    toast({ title: "Document Uploaded" });
                    setOpen(false);
                    form.reset();
                } else {
                    throw new Error(result.message);
                }
            } catch (error: any) {
                 toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Upload className="mr-2 h-4 w-4" /> Upload Company Document</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload New Company Document</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Document Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Policy">Company Policy</SelectItem>
                                            <SelectItem value="Form">HR Form</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="file"
                            render={({ field: { onChange, ref, value, ...rest } }) => (
                                <FormItem>
                                    <FormLabel>File</FormLabel>
                                    <FormControl>
                                        <Input type="file" onChange={e => onChange(e.target.files?.[0])} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                             <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                             <Button type="submit" disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upload
                             </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
