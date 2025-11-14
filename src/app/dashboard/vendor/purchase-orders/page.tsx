
import { createClient } from '@supabase/supabase-js';
import { PurchaseOrderClient } from './client';

async function getPurchaseOrders() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: purchaseOrders, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('[PurchaseOrder] Error fetching:', error);
      return { purchaseOrders: [] };
    }

    return { purchaseOrders: purchaseOrders || [] };
  } catch (error) {
    console.error('[PurchaseOrder] Exception:', error);
    return { purchaseOrders: [] };
  }
}

async function getVendors() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('[Vendor] Error fetching:', error);
      return [];
    }

    return vendors || [];
  } catch (error) {
    console.error('[Vendor] Exception:', error);
    return [];
  }
}

export default async function PurchaseOrderPage() {
    const [{ purchaseOrders }, vendorList] = await Promise.all([
        getPurchaseOrders(), 
        getVendors()
    ]);
    
    return (
       <PurchaseOrderClient initialPurchaseOrders={purchaseOrders} vendors={vendorList} />
    );
}


