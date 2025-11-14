
"use server";
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/client';
import { checkCasbin } from '@/lib/casbinClient';

const supabase = getSupabaseServerClient();
// Define the schema for the AI's expected output
const PayslipFieldSchema = z.object({
  label: z.string().describe("The label for the payslip field (e.g., 'Basic Salary', 'Employee ID')."),
  exampleValue: z.string().describe("An example value for this field (e.g., '?30,000', 'EMP001').")
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
  try {
    if (!supabase) {
      return { success: false, message: 'Database not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    // For now, create format without permission check - can be enhanced later
    const newFormat: PayslipLayout = {
      id: `format-${Date.now()}`,
      name: name,
      ...layout,
    };
    // TODO: Save to database
    revalidatePath('/dashboard/hrms/payroll/formats');
    return { success: true, newFormat };
  } catch (error) {
    console.error('[PayrollFormat] Exception in savePayrollFormat:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getPayrollFormats(): Promise<PayslipLayout[]> {
    // TODO: Query from database
    return Promise.resolve([]);
}

export async function deletePayrollFormat(formatId: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (!supabase) {
      return { success: false, message: 'Database not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    // TODO: Delete from database by formatId
    const deleted = false; // TODO: Query and delete from database
    if (deleted) {
      revalidatePath('/dashboard/hrms/payroll/formats');
      return { success: true };
    }
    return { success: false, message: 'Format not found' };
  } catch (error) {
    console.error('[PayrollFormat] Exception in deletePayrollFormat:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function setDefaultFormatForStore(storeId: string, formatId: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (!supabase) {
      return { success: false, message: 'Database not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    // Check permission using Casbin
    const hasPermission = await checkCasbin({
      userId: user.id,
      organizationId: user.user_metadata?.organization_id || 'default-org',
      resource: 'payslip-format',
      action: 'manage'
    });

    if (!hasPermission) {
      console.log('[PayrollFormat] Permission denied for user:', user.id);
      return { success: false, message: 'Permission denied' };
    }

    // Check if store exists in database
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return { success: false, message: 'Store not found' };
    }

    // Update store with default payslip format
    const { error: updateError } = await supabase
      .from('stores')
      .update({ default_payslip_format_id: formatId })
      .eq('id', storeId);

    if (updateError) {
      console.error('[PayrollFormat] Error updating store:', updateError);
      return { success: false, message: updateError.message };
    }

    revalidatePath('/dashboard/hrms/payroll/formats');
    return { success: true };
  } catch (error) {
    console.error('[PayrollFormat] Exception in setDefaultFormatForStore:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}
