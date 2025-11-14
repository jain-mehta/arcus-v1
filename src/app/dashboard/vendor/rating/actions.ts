
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Types (from database schema)
interface Vendor {
  id: string;
  tenant_id: string;
  name: string;
  email?: string;
  phone?: string;
  rating?: number;
  status?: string;
  created_at?: string;
}

interface VendorRatingCriteria {
  id: string;
  vendor_id: string;
  criteria_name: string;
  weight: number;
  target_score?: number;
  created_at?: string;
}

interface VendorRatingHistory {
  id: string;
  vendor_id: string;
  criteria_id: string;
  score: number;
  notes?: string;
  created_at?: string;
}

export async function getVendors(): Promise<Vendor[]> {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('[VendorRating] Error fetching vendors:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('[VendorRating] Exception fetching vendors:', error);
    return [];
  }
}

export async function getVendorRatingCriteria(
  vendorId: string
): Promise<VendorRatingCriteria[]> {
  try {
    const { data, error } = await supabase
      .from('vendor_rating_criteria')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('weight', { ascending: false });
    
    if (error) {
      console.error('[VendorRating] Error fetching criteria:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('[VendorRating] Exception fetching criteria:', error);
    return [];
  }
}

export async function getVendorRatingHistory(
  vendorId: string
): Promise<VendorRatingHistory[]> {
  try {
    const { data, error } = await supabase
      .from('vendor_rating_history')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('[VendorRating] Error fetching history:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('[VendorRating] Exception fetching history:', error);
    return [];
  }
}

export async function calculateAndUpdateVendorScores(
  vendorId: string,
  updatedCriteria: Partial<any>[]
): Promise<{ success: boolean; message?: string }> {
  try {
    // 1. Update the individual criteria in database
    for (const update of updatedCriteria) {
      const { error } = await supabase
        .from('vendor_rating_criteria')
        .update(update)
        .eq('id', update.id);
      
      if (error) {
        console.error('[VendorRating] Error updating criteria:', error);
        return { success: false, message: error.message };
      }
    }
    
    // 2. Fetch all vendor criteria to recalculate score
    const { data: allCriteria, error: fetchError } = await supabase
      .from('vendor_rating_criteria')
      .select('weight, manualScore, autoScore')
      .eq('vendor_id', vendorId);
    
    if (fetchError || !allCriteria || allCriteria.length === 0) {
      return { success: false, message: 'No criteria found for vendor' };
    }
    
    const totalWeight = allCriteria.reduce((sum: number, c: any) => sum + (c.weight || 0), 0);
    
    if (totalWeight === 0) {
      return { success: false, message: 'Cannot calculate score with zero total weight.' };
    }
    
    const weightedScoreSum = allCriteria.reduce((sum: number, c: any) => {
      const score = c.manualScore !== undefined ? c.manualScore : c.autoScore;
      return sum + ((score || 0) * (c.weight || 0));
    }, 0);
    
    const newOverallScore = weightedScoreSum / totalWeight;
    
    // 3. Update the vendor's main quality_score
    const { error: updateVendorError } = await supabase
      .from('vendors')
      .update({ quality_score: newOverallScore })
      .eq('id', vendorId);
    
    if (updateVendorError) {
      console.error('[VendorRating] Error updating vendor score:', updateVendorError);
      return { success: false, message: updateVendorError.message };
    }
    
    // 4. Add an entry to the rating history
    const { error: historyError } = await supabase
      .from('vendor_rating_history')
      .insert({
        vendor_id: vendorId,
        date: new Date().toISOString(),
        score: newOverallScore
      });
    
    if (historyError) {
      console.error('[VendorRating] Error adding history:', historyError);
      return { success: false, message: historyError.message };
    }
    
    // 5. Revalidate paths to ensure UI updates
    revalidatePath('/dashboard/vendor/rating');
    revalidatePath(`/dashboard/vendor/profile/${vendorId}`);
    revalidatePath('/dashboard/vendor/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error('[VendorRating] Exception in calculateAndUpdateVendorScores:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}
