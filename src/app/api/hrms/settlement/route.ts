import { NextResponse } from 'next/server';
import { getCurrentUser, createSettlementInDb } from '@/lib/firebase/firestore';
import { assertUserPermission } from '@/lib/firebase/rbac';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
        }

        // RBAC: must have manage-settlements
        await assertUserPermission(user.id, 'manage-settlements');

        // Basic validation (ensure required fields present)
        const required = ['employeeId', 'lastWorkingDay', 'reason', 'earnings', 'deductions'];
        for (const k of required) {
            if (!(k in body)) return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
        }

        const settlement = {
            settlementNumber: body.settlementNumber || `FNF-${Date.now()}`,
            employeeId: body.employeeId,
            lastWorkingDay: body.lastWorkingDay,
            reason: body.reason,
            earnings: body.earnings,
            deductions: body.deductions,
            totalEarnings: body.totalEarnings,
            totalDeductions: body.totalDeductions,
            netPayable: body.netPayable,
            processedBy: user.id,
            processedByName: user.name,
        };

        const saved = await createSettlementInDb(user.orgId || 'bobs-org', settlement);

        return NextResponse.json({ success: true, settlement: saved });
    } catch (err: any) {
        console.error('Settlement API error:', err);
        const status = err?.code === 403 ? 403 : 500;
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status });
    }
}
