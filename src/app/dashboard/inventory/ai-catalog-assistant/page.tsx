'use client';

import { useState, useTransition } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Upload, WandSparkles, FileIcon, X, Sparkles, Image as ImageIcon, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addMultipleProducts } from '../actions';
import { extractProductImage, getProductSuggestionsFromCatalogTextOnly } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Label }from '@/components/ui/label';
import type { SuggestProductsFromCatalogTextOnlyInput, SuggestProductsFromCatalogTextOnlyOutput } from '@/ai/flows/suggest-products-from-catalog-text-only';
import type { ExtractProductImageFromCatalogInput, ExtractProductImageFromCatalogOutput } from '@/ai/flows/extract-product-image-from-catalog';


const catalogFormSchema = z.object({
  image: z.instanceof(File).optional().refine(file => !!file, 'An image is required.'),
  description: z.string().optional(),
});
type CatalogFormValues = z.infer<typeof catalogFormSchema>;


const imageFileSchema = z.object({
    base64: z.string(),
    type: z.string(),
}).optional();

const productSuggestionSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters.'),
  sku: z.string().min(1, 'SKU is required.'),
  brand: z.string().min(1, 'Brand is required.'),
  series: z.enum(['Buick', 'Solo', 'Galaxy', 'Cubix-B']),
  category: z.string().min(1, 'Category is required.'),
  subcategory: z.string().optional(),
  unit: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  imageFile: imageFileSchema,
  inventoryType: z.enum(['Factory', 'Store']),
});

const allProductsSchema = z.object({
    products: z.array(productSuggestionSchema)
});
type AllProductsFormValues = z.infer<typeof allProductsSchema>;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export default function AiCatalogAssistantPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pastedImageFile, setPastedImageFile] = useState<File | null>(null);
  const [catalogImageDataUri, setCatalogImageDataUri] = useState<string | null>(null);

  const catalogForm = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: { description: '' },
  });

  const allProductsForm = useForm<AllProductsFormValues>({
    resolver: zodResolver(allProductsSchema),
    defaultValues: { products: [] },
  });
  
  const { fields, replace, update } = useFieldArray({
    control: allProductsForm.control,
    name: "products",
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };
  
  const handleFile = async (file: File) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (isImage || isPdf) {
        catalogForm.setValue('image', file);
        const dataUri = await toBase64(file);
        setCatalogImageDataUri(dataUri);

        if (isImage) {
            setImagePreview(dataUri);
            setPastedImageFile(null);
        } else {
            setImagePreview('pdf');
            setPastedImageFile(file);
        }
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
    setPastedImageFile(null);
  setCatalogImageDataUri(null);
  // Reset only the image field while preserving the description value
  catalogForm.reset({ ...catalogForm.getValues(), image: undefined });
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
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

  async function onGenerate(data: CatalogFormValues) {
    if (!catalogImageDataUri) {
        toast({
            variant: 'destructive',
            title: 'No Image Provided',
            description: 'Please upload an image of the catalog page before generating suggestions.',
        });
        return;
    }
    setIsGenerating(true);
    replace([]); 
    try {
      const result = await getProductSuggestionsFromCatalogTextOnly({
        photoDataUri: catalogImageDataUri,
        description: data.description,
      });

      const formattedResult = result.map(p => ({...p, inventoryType: 'Factory' as const }));
      replace(formattedResult);

      if (result.length === 0) {
        toast({
          title: 'No Products Found',
          description: 'The AI could not identify any products from the provided catalog data. Try a clearer image or add a description.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate product suggestions. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  }
  
  const [isSavingAll, setIsSavingAll] = useState(false);
  async function onSaveAll(data: AllProductsFormValues) {
    setIsSavingAll(true);
  try {
    // Ensure each product has required fields expected by the DB layer
    const productsToAdd = data.products.map((p) => ({
      // keep all suggested fields but provide a safe default for required fields
      ...p,
      quantity: (p as any).quantity ?? 0,
    }));

    const result = await addMultipleProducts(productsToAdd as any);

        if (result.success) {
             toast({
                title: 'Products Saved!',
                description: `${result.count} products have been "added" to the product master.`,
            });
            replace([]);
            clearImage();
        } else {
             toast({
                variant: 'destructive',
                title: 'Error Saving Products',
                description: 'An unknown error occurred.',
            });
        }
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to save products. Please try again.',
        });
    } finally {
        setIsSavingAll(false);
    }
  }


  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
            <WandSparkles className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">AI Catalog Assistant</h1>
        </div>
        <p className="text-muted-foreground">Automatically add products to your inventory by uploading or pasting a page from your catalog.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>1. Upload Catalog Page</CardTitle>
            <CardDescription>Upload an image or PDF of a single catalog page.</CardDescription>
          </CardHeader>
          <CardContent onPaste={handlePaste}>
            <Form {...catalogForm}>
              <form onSubmit={catalogForm.handleSubmit(onGenerate)} className="space-y-6">
                <FormField
                  control={catalogForm.control}
                  name="image"
                  render={() => (
                    <FormItem>
                      <FormLabel>Catalog Page Image or PDF</FormLabel>
                      <FormControl>
                        <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                            {imagePreview ? (
                              <div className='relative w-full h-full p-4 flex items-center justify-center'>
                                {imagePreview === 'pdf' ? (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <FileIcon className="h-16 w-16" />
                                        <span className="font-semibold">{pastedImageFile?.name}</span>
                                    </div>
                                ) : (
                                    <Image src={imagePreview} alt="Catalog preview" layout="fill" className="object-contain" />
                                )}
                                <Button 
                                    variant="destructive" size="icon" 
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={clearImage}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span>, drag and drop, or paste image</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, or PDF</p>
                              </div>
                            )}
                            <Input id="image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
                        </Label>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={catalogForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Descriptions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., 'This page contains the Solo series. Item A is a chrome-plated brass faucet...'" {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isGenerating} className="w-full">
                  {isGenerating ? <Loader2 className="animate-spin" /> : <> <Sparkles className="mr-2 h-4 w-4" /> Generate Product Details</>}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Review & Add Products</CardTitle>
             <CardDescription>Review the AI-generated suggestions, extract images, and add them to your product master.</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : fields.length > 0 ? (
            <FormProvider {...allProductsForm}>
                <form onSubmit={allProductsForm.handleSubmit(onSaveAll)} className="space-y-4">
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {fields.map((product, index) => (
                          <SuggestionItem key={product.id} index={index} catalogImageDataUri={catalogImageDataUri} />
                        ))}
                    </Accordion>
                     <Button type="submit" disabled={isSavingAll} className="w-full">
                        {isSavingAll ? <Loader2 className="animate-spin" /> : `Save All ${fields.length} Products`}
                    </Button>
                </form>
              </FormProvider>
            ) : (
                <div className="text-center text-muted-foreground p-8 flex flex-col items-center gap-4 h-64 justify-center">
                    <FileIcon className="h-10 w-10" />
                    <p>Suggestions will appear here once generated.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function SuggestionItem({ index, catalogImageDataUri }: { index: number, catalogImageDataUri: string | null }) {
  const { control } = useFormContext();
  const { fields } = useFieldArray({ control, name: 'products' });
  const item = fields[index] as any;
  
  if (!item) {
    return null;
  }

  return (
    <AccordionItem value={item.id} className="border-b-0">
        <Card className="bg-muted/30">
          <SuggestionItemContent index={index} catalogImageDataUri={catalogImageDataUri} />
        </Card>
    </AccordionItem>
  );
}


function SuggestionItemContent({ index, catalogImageDataUri }: { index: number, catalogImageDataUri: string | null }) {
  const { control, setValue, watch, getValues } = useFormContext();
  const { fields, update } = useFieldArray({ control, name: 'products' });
  const item = fields[index] as any;
  const { toast } = useToast();

  const [isExtractingImage, startImageExtraction] = useTransition();
  
  const imagePreview = watch(`products.${index}.imageFile.base64`);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        toBase64(file).then(base64 => {
            setValue(`products.${index}.imageFile`, { base64, type: file.type }, { shouldValidate: true });
        });
    }
  };

  const onExtractImage = () => {
    if (!catalogImageDataUri) {
        toast({ variant: 'destructive', title: 'Missing Catalog Image' });
        return;
    }
    startImageExtraction(async () => {
        try {
            const productName = getValues(`products.${index}.name`);
            const result = await extractProductImage({
                productName,
                photoDataUri: catalogImageDataUri,
            });

            if (result && result.imageFile) {
                const fullDataUri = `data:${result.imageFile.type};base64,${result.imageFile.base64}`;
                const updatedItem = { ...item, imageFile: { base64: fullDataUri, type: result.imageFile.type } };
                update(index, updatedItem);
                toast({ title: "Image Extracted!", description: `An image for ${productName} has been extracted.`});
            } else {
                throw new Error("No image file returned from extraction.");
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Image Extraction Failed'});
        }
    });
  }
  
  if(!item) return null;

  return (
    <>
        <AccordionTrigger className="p-4 hover:no-underline text-left">
            <div className='flex justify-between items-center w-full'>
                <div className="flex items-center gap-4">
                     <div className="w-10 h-10 flex items-center justify-center bg-background rounded-md border">
                        {imagePreview ? (
                            <Image src={imagePreview} alt={item.name} width={40} height={40} className="rounded-md object-cover" />
                        ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                     </div>
                    <div className="space-y-1">
                        <p className="font-semibold">{item.name}</p>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span>SKU: {item.sku}</span>
                            <span>|</span>
                            <span>Price: ₹{item.price}</span>
                            <Badge variant="outline">{item.series}</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={control} name={`products.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name={`products.${index}.sku`} render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={control} name={`products.${index}.category`} render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name={`products.${index}.subcategory`} render={({ field }) => (<FormItem><FormLabel>Subcategory</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                
                <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 flex items-center justify-center bg-background rounded-md border">
                            {imagePreview ? (
                                <Image src={imagePreview} alt="preview" width={64} height={64} className="rounded-md object-cover" />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>
                        <div className='space-y-2'>
                             <Button type="button" variant="outline" onClick={onExtractImage} disabled={isExtractingImage}>
                                {isExtractingImage ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Camera className="mr-2 h-4 w-4" />}
                                Extract from Catalog
                            </Button>
                             <Input id={`image-upload-${index}`} type="file" className="max-w-xs" onChange={handleImageFileChange} accept="image/*" />
                        </div>
                    </div>
                     <FormMessage />
                </FormItem>
               
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField
                        control={control}
                        name={`products.${index}.series`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Series</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Buick">Buick</SelectItem>
                                <SelectItem value="Solo">Solo</SelectItem>
                                <SelectItem value="Galaxy">Galaxy</SelectItem>
                                <SelectItem value="Cubix-B">Cubix-B</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={control}
                        name={`products.${index}.brand`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Brand</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Bobs">Bobs</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={control} name={`products.${index}.price`} render={({ field }) => (<FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name={`products.${index}.unit`} render={({ field }) => (<FormItem><FormLabel>Unit</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name={`products.${index}.inventoryType`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Add to</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Factory">Factory Inventory</SelectItem>
                                <SelectItem value="Store">Store Inventory</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>
        </AccordionContent>
    </>
  );
}
