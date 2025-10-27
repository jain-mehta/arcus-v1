
'use server';
/**
 * @fileOverview An AI flow for extracting a specific product image from a catalog page.
 *
 * - extractProductImageFromCatalog - A function that takes a catalog image and product name, returning a cropped image.
 * - ExtractProductImageFromCatalogInput - The input type for the function.
 * - ExtractProductImageFromCatalogOutput - The return type for the function.
 */

import { z } from 'zod';
// Removed genkit/media import to avoid build-time type errors; using plain data URI reference in prompt

// Define the schema for the input data.
const ExtractProductImageFromCatalogInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a catalog page, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productName: z.string().describe('The name of the specific product to find and crop from the catalog page.'),
});
export type ExtractProductImageFromCatalogInput = z.infer<typeof ExtractProductImageFromCatalogInputSchema>;


// Define the schema for the output data.
const ExtractProductImageFromCatalogOutputSchema = z.object({
  imageFile: z.object({
    base64: z.string().describe("The base64-encoded string of the cropped product image."),
    type: z.string().describe("The MIME type of the cropped product image (e.g., 'image/png').")
  }).describe("The cropped image file of the specified product.")
});
export type ExtractProductImageFromCatalogOutput = z.infer<typeof ExtractProductImageFromCatalogOutputSchema>;


// Define the prompt at runtime and add a timeout helper
async function defineExtractPrompt(aiInstance: any) {
  return aiInstance.definePrompt({
    name: 'extractProductImagePrompt',
    input: { schema: ExtractProductImageFromCatalogInputSchema },
    output: { schema: ExtractProductImageFromCatalogOutputSchema },
    prompt: `
        You are an image processing expert. Your task is to find a specific product in an image of a product catalog page, crop it, and return the cropped image.

        Catalog Page Image (data URI): {{{photoDataUri}}}
        Product to find: {{{productName}}}

        Analyze the image, locate the product named "{{{productName}}}", and crop the image to show only that product. 
        
        Return the result in the specified JSON format, with the cropped image encoded as a base64 string in the 'imageFile.base64' field and its MIME type in the 'imageFile.type' field.
    `,
    config: {
        model: 'googleai/gemini-pro-vision',
        responseModalities: ['TEXT', 'IMAGE'],
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error('AI request timed out')), ms);
  });
  return Promise.race([promise.then((r) => { clearTimeout(timer); return r; }), timeout]) as Promise<T>;
}

export async function extractProductImageFromCatalog(
  input: ExtractProductImageFromCatalogInput
): Promise<ExtractProductImageFromCatalogOutput> {
  // Dynamically import getAi at runtime
  const { getAi } = await import('@/ai/genkit');
  const ai = await getAi();
  const prompt = await defineExtractPrompt(ai);

  const resultAny = await withTimeout(prompt(input)) as any;
  const { output } = resultAny || {};
  if (!output) throw new Error('Image extraction failed or no structured data was returned.');
  return output;
}

