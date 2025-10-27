

'use server';

import { MOCK_PRODUCTS, getPurchaseOrders as getPurchaseOrdersFromDb, updatePurchaseOrderInDb, getVendors as getVendorsFromDb, MOCK_COMMUNICATION_LOGS, MOCK_VENDORS, getVendor as getVendorFromDb, getVendorDocuments as getVendorDocumentsFromDb, getCurrentUser, createPurchaseOrderInDb } from '@/lib/mock-data/firestore';
import { assertUserPermission } from '@/lib/mock-data/rbac';
import { getUser, getUserPermissions, getSubordinates } from '@/lib/mock-data/rbac';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';
import type { CommunicationLog, MaterialMapping, UserContext, Vendor, VolumeDiscount, VendorRatingCriteria, VendorRatingHistory, SalesSnapshot, Invoice, VendorDocument, Visit, Store, LeavePolicy, LeaveRequest, JobOpening, Applicant, SalaryStructure, Payslip, AuditLog, PurchaseOrder } from '@/lib/mock-data/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


// This file will contain all server actions for the Vendor module.

// MOCK: In a real app, this would get the logged-in user's ID from the session.
async function getCurrentUserId(): Promise<string | null> {
    const user = await getCurrentUser();
    return user?.id || null;
}

async function buildUserContext(userId: string | null): Promise<UserContext | null> {
    if (!userId) {
        return null;
    }
    const [user, permissions, subordinates] = await Promise.all([
        getUser(userId),
        getUserPermissions(userId),
        getSubordinates(userId)
    ]);

    if (!user) {
        console.warn('buildUserContext: User not found, returning null context.');
        return null;
    }

    return {
        user,
        permissions,
        subordinates,
        orgId: user.orgId,
    };
}


export async function getVendorDashboardData() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

    const userId = await getCurrentUserId();
    const userContext = await buildUserContext(userId);

    if (!userContext) {
        return {
            kpis: { activeVendors: 0, outstandingBalance: 0, ytdSpend: 0 },
            upcomingPayments: [],
            vendorPerformanceData: []
        };
    }

    const [
        vendors,
        { purchaseOrders },
    ] = await Promise.all([
        getVendorsFromDb(),
        // FIX: Pass the userContext to the data fetching function.
        getPurchaseOrdersFromDb(undefined, undefined, userContext),
    ]);

    // KPI Cards
    const activeVendors = vendors.filter(v => v.status === 'Active').length;
    const outstandingBalance = purchaseOrders
        .filter(po => po.paymentStatus !== 'Paid')
        .reduce((acc, po) => acc + (po.totalAmount - po.amountGiven), 0);
    const ytdSpend = purchaseOrders.reduce((acc, po) => acc + po.totalAmount, 0);

    const kpis = { activeVendors, outstandingBalance, ytdSpend };

    // Upcoming Payments
    const upcomingPayments = purchaseOrders
        .filter(po => po.paymentStatus !== 'Paid' && new Date(po.deliveryDate) > new Date())
        .sort((a,b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
        .slice(0, 5);

    // Vendor Performance Chart
    const vendorPerformanceData = vendors
        .filter(v => v.status === 'Active')
        .map(v => ({
            name: v.name,
            onTimeDelivery: v.onTimeDelivery,
            qualityScore: v.qualityScore,
        }));
    
    return {
        kpis,
        upcomingPayments,
        vendorPerformanceData
    };
}


export async function getPurchaseHistoryForVendor(vendorId: string, from?: Date, to?: Date): Promise<PurchaseOrder[]> {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

    const userContext = await buildUserContext(await getCurrentUserId());
    const { purchaseOrders } = await getPurchaseOrdersFromDb(vendorId, { from, to }, userContext ?? undefined);
    return purchaseOrders;
}

export async function updatePurchaseHistory(updates: { poId: string, amountGiven: number, paymentStatus: PurchaseOrder['paymentStatus'] }[]) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'supply', 'pos');

    const userContext = await buildUserContext(await getCurrentUserId());
    
    if (!userContext) {
        throw new Error('User context is required to update purchase history.');
    }
    
    // In a real app, this would be a single batched write to Firestore.
    const updatePromises = updates.map(update => 
        updatePurchaseOrderInDb(update.poId, {
            amountGiven: update.amountGiven,
            paymentStatus: update.paymentStatus,
        }, userContext)
    );

    await Promise.all(updatePromises);
    
    revalidatePath('/dashboard/vendor/history');
    return { success: true };
}


export async function createPurchaseOrder(data: any) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        return { success: false, message: 'Unauthorized' };
    }
    await assertPermission(sessionClaims, 'supply', 'pos');

    const currentUser = await getCurrentUser();
    const userContext = await buildUserContext(currentUser?.id || null);
    if (!userContext) {
        return { success: false, message: 'Permission denied.' };
    }
    // Ensure the user has permission to create/manage POs
    try {
        await assertUserPermission(userContext.user.id, 'manage-purchase-orders');
    } catch (err) {
        return { success: false, message: 'Forbidden' };
    }

    const result = await createPurchaseOrderInDb({ ...data, orgId: userContext.orgId }, userContext as any);
    revalidatePath('/dashboard/vendor/purchase-orders');
    return result;
}

export async function updatePurchaseOrderStatus(poId: string, status: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'supply', 'pos');

    const userContext = await buildUserContext(await getCurrentUserId());
    if (!userContext) {
        throw new Error('User context is required to update purchase order status.');
    }

    // Ensure caller has permission to update purchase orders
    try {
        await assertUserPermission(userContext.user.id, 'manage-purchase-orders');
    } catch (err) {
        return { success: false, message: 'Forbidden' };
    }
    
    // Update the PO status
    await updatePurchaseOrderInDb(poId, { status: status as PurchaseOrder['status'] }, userContext);

    // If the PO is marked as "Delivered", update the stock quantities
    if (status === 'Delivered') {
        const { purchaseOrders } = await getPurchaseOrdersFromDb(undefined, undefined, userContext);
        const po = purchaseOrders.find(p => p.id === poId);

        if (po) {
            po.lineItems.forEach(item => {
                // Find the corresponding product in the main product master to update its stock
                const productIndex = MOCK_PRODUCTS.findIndex(p => p.sku === item.sku && p.inventoryType === 'Factory');
                if (productIndex !== -1) {
                    MOCK_PRODUCTS[productIndex].quantity += item.quantity;
                    console.log(`Updated stock for ${item.sku}: Added ${item.quantity}, New total: ${MOCK_PRODUCTS[productIndex].quantity}`);
                }
            });
        }
    }

    revalidatePath(`/dashboard/vendor/purchase-orders/${poId}`);
    revalidatePath('/dashboard/vendor/reorder-management'); // Revalidate reorder page
    revalidatePath('/dashboard/inventory'); // Revalidate inventory dashboard
    revalidatePath('/dashboard/inventory/product-master'); // Revalidate product master
    return { success: true };
}

export async function calculateAndUpdateVendorScores(vendorId: string, criteria: any[]) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

    console.log('Mock calculateAndUpdateVendorScores:', vendorId, criteria);
    revalidatePath('/dashboard/vendor/rating');
    return { success: true };
}


