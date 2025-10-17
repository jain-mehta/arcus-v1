

'use server';

import { getProducts } from "../data";
import type { Product, UserContext } from "@/lib/firebase/types";
import { getUser, getSubordinates, getUserPermissions } from '@/lib/firebase/rbac';
import { getCurrentUser } from '@/app/dashboard/sales/actions';
import { MOCK_ORGANIZATION_ID } from '@/lib/firebase/firestore';

export interface ReportData {
    generatedAt: string;
    filters: {
        location: 'all' | 'Factory' | 'Store';
        method: 'current-value';
    };
    summary: {
        totalValue: number;
        totalQuantity: number;
        totalSKUs: number;
    };
    products: Product[];
}

export async function generateValuationReport(filters: {
    location: 'all' | 'Factory' | 'Store',
    method: 'current-value'
}): Promise<ReportData> {

    const user = await getCurrentUser();
    let allProducts: Product[] = [];
    if (user) {
        const [permissions, subordinates] = await Promise.all([
            getUserPermissions(user.id),
            getSubordinates(user.id),
        ]);
        const userContext: UserContext = { user, permissions, subordinates, orgId: user.orgId || MOCK_ORGANIZATION_ID };
        allProducts = await getProducts(userContext);
    }
    
    const filteredProducts = filters.location === 'all'
        ? allProducts
        : allProducts.filter(p => p.inventoryType === filters.location);
        
    let totalValue = 0;
    let totalQuantity = 0;

    filteredProducts.forEach(p => {
        totalValue += p.price * p.quantity;
        totalQuantity += p.quantity;
    });

    const report: ReportData = {
        generatedAt: new Date().toISOString(),
        filters: filters,
        summary: {
            totalValue: totalValue,
            totalQuantity: totalQuantity,
            totalSKUs: filteredProducts.length,
        },
        products: filteredProducts,
    };
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return report;
}

    
