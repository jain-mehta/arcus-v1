
'use server';
/**
 * @fileOverview An AI flow for suggesting products from a catalog page.
 *
 * - suggestProductsFromCatalogTextOnly - A function that suggests products based on a catalog image and description.
 * - SuggestProductsFromCatalogTextOnlyInput - The input type for the function.
 * - SuggestProductsFromCatalogTextOnlyOutput - The return type for the function.
 */

import { z } from 'zod';
// Removed genkit/media import to avoid build-time type errors

// Define the schema for the input data.
const SuggestProductsFromCatalogTextOnlyInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a catalog page, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().optional().describe('Optional user-provided text describing the products on the page.'),
});
export type SuggestProductsFromCatalogTextOnlyInput = z.infer<typeof SuggestProductsFromCatalogTextOnlyInputSchema>;


const ProductSuggestionSchema = z.object({
  name: z.string().describe('The full name of the product.'),
  sku: z.string().describe("The product's Stock Keeping Unit (SKU) or model number."),
  brand: z.string().describe("The brand of the product. It should be 'Bobs'."),
  series: z.enum(['Buick', 'Solo', 'Galaxy', 'Cubix-B']).describe("The series the product belongs to."),
  category: z.string().describe('The primary category of the product (e.g., Faucets, Showers).'),
  price: z.coerce.number().describe('The price of the product in Indian Rupees (?).'),
});

// Define the schema for the output data.
const SuggestProductsFromCatalogTextOnlyOutputSchema = z.array(ProductSuggestionSchema);
export type SuggestProductsFromCatalogTextOnlyOutput = z.infer<typeof SuggestProductsFromCatalogTextOnlyOutputSchema>;


// Define the prompt at runtime to avoid build errors
async function defineSuggestProductsPrompt(aiInstance: any) {
  return aiInstance.definePrompt({
    name: 'suggestProductsPrompt',
    input: { schema: SuggestProductsFromCatalogTextOnlyInputSchema },
    output: { schema: SuggestProductsFromCatalogTextOnlyOutputSchema },
    prompt: `
    You are an expert at analyzing product catalogs for a bathroom fittings company called "Bobs".
    Your task is to identify all products on the given catalog page and extract their details.

    Use the image as the primary source. If a text description is provided, use it as additional context.

    Catalog Page Image: {{media url=photoDataUri}}
    User Description: {{{description}}}

    For each product you identify, provide the following structured information:
    - name: The product's name as shown in the catalog.
    - sku: The SKU or model number.
    - brand: This should always be 'Bobs'.
    - series: The series this product belongs to (must be one of: Buick, Solo, Galaxy, Cubix-B).
    - category: The general category (e.g., Faucets, Showers, Accessories).
    - price: The price in INR.

    Return the data as a list of products.
  `,
    config: {
        model: 'googleai/gemini-pro-vision',
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

export async function suggestProductsFromCatalogTextOnly(
  input: SuggestProductsFromCatalogTextOnlyInput
): Promise<SuggestProductsFromCatalogTextOnlyOutput> {
  // Dynamically import getAi at runtime
  const { getAi } = await import('@/ai/genkit');
  const ai = await getAi();
  const prompt = await defineSuggestProductsPrompt(ai);
  
  const resultAny = await withTimeout(prompt(input), 15000) as any;
  return resultAny.output || [];
}

