 'use server';
/**
 * @fileOverview An AI flow for summarizing a sales opportunity.
 *
 * - summarizeOpportunity - A function that takes opportunity details and returns a summary.
 * - SummarizeOpportunityInput - The input type for the summarizeOpportunity function.
 * - SummarizeOpportunityOutput - The return type for the summarizeOpportunity function.
 */

import { z } from 'zod';

// Define the schema for the input data.
const SummarizeOpportunityInputSchema = z.object({
  title: z.string().describe('The title of the sales opportunity.'),
  customerName: z.string().describe('The name of the customer or company.'),
  value: z.number().describe('The potential monetary value of the deal.'),
  stage: z.string().describe('The current stage of the opportunity in the sales pipeline.'),
  closeDate: z.string().describe('The expected close date for the deal.'),
});
export type SummarizeOpportunityInput = z.infer<typeof SummarizeOpportunityInputSchema>;

// Define the schema for the output data.
const SummarizeOpportunityOutputSchema = z.object({
  summary: z.string().describe('A concise, one-paragraph summary of the opportunity, highlighting its key aspects, potential, and current status. Should be written in a professional, business tone.'),
});
export type SummarizeOpportunityOutput = z.infer<typeof SummarizeOpportunityOutputSchema>;

// Define the prompt that will be sent to the AI model.
async function defineSummarizePrompt(aiInstance: any) {
  return aiInstance.definePrompt({
    name: 'summarizeOpportunityPrompt',
    input: { schema: SummarizeOpportunityInputSchema },
    output: { schema: SummarizeOpportunityOutputSchema },
    prompt: `
    You are a Sales Operations Analyst. Your task is to summarize a sales opportunity based on the data provided.
    Provide a short, insightful paragraph that a busy sales manager can read to quickly understand the deal.

    Opportunity Details:
    - Title: {{{title}}}
    - Customer: {{{customerName}}}
    - Value: {{{value}}}
    - Current Stage: {{{stage}}}
    - Expected Close Date: {{{closeDate}}}
  `,
  });
}

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error('AI request timed out')), ms);
  });
  return Promise.race([promise.then((r) => { clearTimeout(timer); return r; }), timeout]) as Promise<T>;
}

export async function summarizeOpportunity(
  input: SummarizeOpportunityInput
): Promise<SummarizeOpportunityOutput> {
  const { getAi } = await import('@/ai/genkit');
  const ai = await getAi();
  const prompt = await defineSummarizePrompt(ai);
  const resultAny = await withTimeout(prompt(input), 8000) as any;
  return resultAny.output!;
}

