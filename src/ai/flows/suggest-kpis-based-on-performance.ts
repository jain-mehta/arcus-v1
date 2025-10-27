 'use server';
/**
 * @fileOverview An AI flow for suggesting Key Performance Indicators (KPIs).
 *
 * - suggestKpisBasedOnPerformance - A function that suggests KPIs based on performance data.
 * - SuggestKpisBasedOnPerformanceInput - The input type for the function.
 * - SuggestKpisBasedOnPerformanceOutput - The return type for the function.
 */

import { z } from 'zod';

const SuggestKpisBasedOnPerformanceInputSchema = z.object({
  moduleName: z.string().describe('The name of the business module (e.g., Sales, Inventory).'),
  currentPerformanceData: z.string().describe('A JSON string representing the current performance metrics.'),
  pastKpiPerformance: z.string().optional().describe('A JSON string of past KPI performance for historical context.'),
  externalData: z.string().optional().describe('A JSON string of external factors like market trends or competitor activity.'),
});
export type SuggestKpisBasedOnPerformanceInput = z.infer<typeof SuggestKpisBasedOnPerformanceInputSchema>;


const KpiSuggestionSchema = z.object({
    kpiName: z.string().describe("The specific, measurable name of the suggested KPI. E.g., 'Average Deal Size'."),
    target: z.string().describe("A realistic, quantifiable target for the KPI. E.g., 'Increase to ?30,000' or 'Reduce to 24 hours'."),
    description: z.string().describe("A brief, one-sentence description of what this KPI measures."),
    rationale: z.string().describe("A detailed, data-driven explanation for why this KPI is being suggested, referencing the input data provided."),
});

const SuggestKpisBasedOnPerformanceOutputSchema = z.array(KpiSuggestionSchema);
export type SuggestKpisBasedOnPerformanceOutput = z.infer<typeof SuggestKpisBasedOnPerformanceOutputSchema>;


async function defineSuggestKpisPrompt(aiInstance: any) {
  return aiInstance.definePrompt({
    name: 'suggestKpisPrompt',
    input: { schema: SuggestKpisBasedOnPerformanceInputSchema },
    output: { schema: SuggestKpisBasedOnPerformanceOutputSchema },
    prompt: `
    You are an expert business analyst for a company that manufactures and sells bathroom fittings.
    Your task is to suggest relevant Key Performance Indicators (KPIs) based on the provided performance data for a specific business module.

    Analyze the following data for the '{{{moduleName}}}' module:
    - Current Performance Metrics: {{{currentPerformanceData}}}
    - Past KPI Performance: {{{pastKpiPerformance}}}
    - External Market Data: {{{externalData}}}

    Based on this data, identify areas for improvement or opportunities for growth.
    For each identified area, formulate a specific, measurable, achievable, relevant, and time-bound (SMART) KPI.

    Return a list of suggested KPIs. For each KPI, provide:
    1. A clear name (kpiName).
    2. A specific target (target).
    3. A brief description of what it measures (description).
    4. A strong rationale (rationale) explaining why it's important *right now*, citing specific data points from the input.
  `,
  });
}

function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error('AI request timed out')), ms);
  });
  return Promise.race([promise.then((r) => { clearTimeout(timer); return r; }), timeout]) as Promise<T>;
}

export async function suggestKpisBasedOnPerformance(
  input: SuggestKpisBasedOnPerformanceInput
): Promise<SuggestKpisBasedOnPerformanceOutput> {
  const { getAi } = await import('@/ai/genkit');
  const ai = await getAi();
  const prompt = await defineSuggestKpisPrompt(ai);
  const resultAny = await withTimeout(prompt(input), 10000) as any;
  return resultAny.output || [];
}

