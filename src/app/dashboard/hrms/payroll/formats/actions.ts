
"use server";
import { z } from 'zod';
import { MOCK_PAYROLL_FORMATS, MOCK_STORES, getCurrentUser as getCurrentUserFromDb } from '@/lib/firebase/firestore';
import { revalidatePath } from 'next/cache';
import { assertUserPermission } from '@/lib/firebase/rbac';

// Define the schema for the AI's expected output
const PayslipFieldSchema = z.object({
  label: z.string().describe("The label for the payslip field (e.g., 'Basic Salary', 'Employee ID')."),
  exampleValue: z.string().describe("An example value for this field (e.g., '₹30,000', 'EMP001').")
});

const PayslipSectionSchema = z.object({
  title: z.string().describe("The title of this section (e.g., 'Employee Details', 'Earnings', 'Deductions')."),
  columns: z.coerce.number().min(1).max(2).describe("The number of columns this section should span in the layout."),
  fields: z.array(PayslipFieldSchema).describe("A list of fields within this section.")
});

export const PayslipLayoutSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  header: z.object({
    companyName: z.string().describe("The name of the company."),
    companyAddress: z.string().describe("The address of the company."),
    title: z.string().describe("The main title of the document (e.g., 'Payslip', 'Salary Slip')."),
    period: z.string().describe("The pay period (e.g., 'For the month of July 2024').")
  }),
  body: z.object({
    gridColumns: z.coerce.number().min(1).max(2).describe("The number of columns for the main body layout."),
    sections: z.array(PayslipSectionSchema).describe("The main sections of the payslip.")
  }),
  footer: z.object({
    summary: z.array(z.object({
      label: z.string(),
      exampleValue: z.string(),
      isTotal: z.boolean().describe("True if this is a final total, like 'Net Salary'.")
    })).describe("The summary section, including net pay."),
    notes: z.string().optional().describe("Any final notes or declarations at the bottom of the payslip.")
  })
});

export type PayslipLayout = z.infer<typeof PayslipLayoutSchema>;

// Define the AI prompt at runtime to avoid bundling server-only modules into the client bundle.
// Also add a timeout wrapper so the server won't hang on long AI calls.
async function defineReplicatePrompt(aiInstance: any) {
  return aiInstance.definePrompt({
    name: 'replicatePayslipPrompt',
    input: { schema: z.object({ photoDataUri: z.string(), prompt: z.string() }) },
    output: { schema: PayslipLayoutSchema },
    prompt: `
        You are an expert in document layout analysis, specializing in financial documents like payslips.
        Your task is to analyze an image of a payslip and replicate its structure in a structured JSON format.

        Image of the payslip:
        {{media url=photoDataUri}}

        User instructions:
        "{{{prompt}}}"

        Analyze the layout, including the header, the main body sections (like employee details, earnings, deductions), and the footer summary.
        
        - Identify all fields and their labels.
        - Group fields into logical sections.
        - Determine the overall grid structure (how many main columns are in the body).
        - Pay attention to user instructions to modify or add fields.
        - Provide sensible example values for all fields.

        Return the complete structure of the payslip in the specified JSON format.
    `,
    config: {
      model: 'googleai/gemini-pro-vision',
    }
  });
}

// Helper to add a timeout to a promise
function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error('AI request timed out')), ms);
  });
  return Promise.race([promise.then((r) => { clearTimeout(timer); return r; }), timeout]) as Promise<T>;
}

export async function replicatePayslipFormat(imageDataUri: string, userPrompt: string): Promise<PayslipLayout> {
  // Lazy import to avoid bundling genkit/handlebars into client builds
  const { getAi } = await import('@/ai/genkit');
  const ai = await getAi();
  const replicatePayslipPrompt = await defineReplicatePrompt(ai);

  const call = replicatePayslipPrompt({ photoDataUri: imageDataUri, prompt: userPrompt || 'Replicate the structure as shown in the image.' });
  const resultAny = await withTimeout(call, 15000) as any; // cast to any because the AI SDK types are dynamic
  const { output } = resultAny || {};

  if (!output) {
    throw new Error('AI failed to generate a layout from the provided image.');
  }
  return output;
}


// --- New Actions for Saving and Managing Formats ---

export async function savePayrollFormat(name: string, layout: Omit<PayslipLayout, 'id' | 'name'>): Promise<{ success: boolean, newFormat?: PayslipLayout, message?: string }> {
  const currentUser = await getCurrentUserFromDb();
  if (!currentUser) return { success: false, message: 'Permission denied.' };
  try { await assertUserPermission(currentUser.id, 'manage-payslip-formats'); } catch (err) { return { success: false, message: 'Forbidden' } }

  const newFormat: PayslipLayout = {
    id: `format-${Date.now()}`,
    name: name,
    ...layout,
  };
  MOCK_PAYROLL_FORMATS.push(newFormat);
  revalidatePath('/dashboard/hrms/payroll/formats');
  return { success: true, newFormat };
}

export async function getPayrollFormats(): Promise<PayslipLayout[]> {
    return Promise.resolve(MOCK_PAYROLL_FORMATS);
}

export async function deletePayrollFormat(formatId: string): Promise<{ success: boolean }> {
  const currentUser = await getCurrentUserFromDb();
  if (!currentUser) return { success: false };
  try { await assertUserPermission(currentUser.id, 'manage-payslip-formats'); } catch (err) { return { success: false } }

  const index = MOCK_PAYROLL_FORMATS.findIndex(f => f.id === formatId);
  if (index > -1) {
    MOCK_PAYROLL_FORMATS.splice(index, 1);
    revalidatePath('/dashboard/hrms/payroll/formats');
    return { success: true };
  }
  return { success: false };
}

export async function setDefaultFormatForStore(storeId: string, formatId: string): Promise<{ success: boolean }> {
  const currentUser = await getCurrentUserFromDb();
  if (!currentUser) return { success: false };
  try { await assertUserPermission(currentUser.id, 'manage-payslip-formats'); } catch (err) { return { success: false } }
    // In a real app, you would update the store document in Firestore.
    const storeIndex = MOCK_STORES.findIndex(s => s.id === storeId);
    if (storeIndex > -1) {
        // (MOCK_STORES[storeIndex] as any).defaultPayslipFormatId = formatId;
        console.log(`(Mock) Set default format for store ${storeId} to ${formatId}`);
        revalidatePath('/dashboard/hrms/payroll/formats');
        return { success: true };
    }
    return { success: false };
}
