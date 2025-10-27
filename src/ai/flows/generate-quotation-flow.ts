'use server';
/**
 * @fileOverview An AI flow for generating a sales quotation.
 *
 * - generateQuotation - A function that takes a customer ID and a natural language prompt to generate a quotation.
 * - GenerateQuotationInput - The input type for the generateQuotation function.
 * - GenerateQuotationOutput - The return type for the generateQuotation function.
 */

// Use dynamic import for getAi at runtime to avoid bundling server-only genkit into client builds
import { z } from 'zod';
import { getProducts as getProductsFromDb } from '@/app/dashboard/inventory/data';

// Define the schema for the input data.
const GenerateQuotationInputSchema = z.object({
  customerId: z.string().describe('The ID of the customer for whom the quotation is being generated.'),
  prompt: z.string().describe('A natural language description of the products and quantities required for the quote. E.g., "quote for 10 faucets and 5 showers".'),
});
export type GenerateQuotationInput = z.infer<typeof GenerateQuotationInputSchema>;

const LineItemSchema = z.object({
    productId: z.string().describe("The unique ID of the product from the catalog."),
    name: z.string().describe("The full name of the product."),
    sku: z.string().describe("The product's Stock Keeping Unit (SKU)."),
    quantity: z.coerce.number().describe("The quantity of this product to be quoted."),
    unitPrice: z.coerce.number().describe("The price for a single unit of this product."),
});

// Define the schema for the output data.
const GenerateQuotationOutputSchema = z.object({
  lineItems: z.array(LineItemSchema).describe("An array of line items for the quotation."),
  totalAmount: z.coerce.number().describe("The calculated total amount for the entire quotation."),
});
export type GenerateQuotationOutput = z.infer<typeof GenerateQuotationOutputSchema>;


/**
 * A Genkit tool for finding products by name.
 * Used by the AI quotation generation flow.
 */
let findProducts: any;

async function ensureFindProducts(aiInstance: any) {
  if (findProducts) return findProducts;
  findProducts = aiInstance.defineTool(
    {
      name: 'findProducts',
      description: 'Searches for products in the master catalog by name.',
      inputSchema: z.object({
        name: z.string().describe('The name or part of the name of the product to search for.'),
      }),
      outputSchema: z.array(
        z.object({
          productId: z.string(),
          name: z.string(),
          sku: z.string(),
          unitPrice: z.number(),
        })
      ),
    },
    async (input: any) => {
      console.log(`[Tool] Searching for products matching: ${input.name}`);
      const allProducts = await getProductsFromDb(undefined as any); 
      const matchingProducts = allProducts
        .filter(p => p.name.toLowerCase().includes(input.name.toLowerCase()))
        .map(p => ({
            productId: p.id,
            name: p.name,
            sku: p.sku,
            unitPrice: p.price,
        }));
      console.log(`[Tool] Found ${matchingProducts.length} products.`);
      return matchingProducts;
    }
  );
  return findProducts;
}

// Define the prompt that will be sent to the AI model.
let generateQuotationPrompt: any;

async function ensureGenerateQuotationPrompt(aiInstance: any) {
  if (generateQuotationPrompt) return generateQuotationPrompt;
  const tool = await ensureFindProducts(aiInstance);
  generateQuotationPrompt = aiInstance.definePrompt({
    name: 'generateQuotationPrompt',
    input: { schema: GenerateQuotationInputSchema },
    output: { schema: GenerateQuotationOutputSchema },
    tools: [tool],
    prompt: `
    You are a sales assistant responsible for creating quotations.
    Your task is to generate a quotation based on a user's natural language request.

    User Request: "{{{prompt}}}"

    1.  First, use the 'findProducts' tool to search for each product mentioned in the user's request.
    2.  If you find multiple products for a search term, choose the most relevant one.
    3.  Construct a list of line items with the correct productId, name, sku, quantity, and unitPrice for each product.
    4.  Calculate the total amount for the quotation by summing up (quantity * unitPrice) for all line items. Do not apply taxes.
    5.  Return the final structured quotation.
  `,
  });
  return generateQuotationPrompt;
}

// Define the Genkit flow.
async function generateQuotationFlowImpl(input: any) {
  const { getAi } = await import('@/ai/genkit');
  const ai = await getAi();
  const prompt = await ensureGenerateQuotationPrompt(ai);
  const result = await prompt(input) as any;
  return result.output!;
}

// Export a wrapper function to be called by server actions.
export async function generateQuotation(
  input: GenerateQuotationInput
): Promise<GenerateQuotationOutput> {
  return generateQuotationFlowImpl(input);
}

