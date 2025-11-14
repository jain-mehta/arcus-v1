'use server';

import { getSupabaseServerClient } from '@/lib/supabase/client';

export async function getLeaderboardData(): Promise<any> {
    try {
        const supabase = getSupabaseServerClient();
        if (!supabase) return { error: 'Database connection failed' };

        // Get sales data aggregated by user
        const { data: salesOrders, error } = await supabase
            .from('sales_orders')
            .select('user_id, total_amount, created_at');

        if (error) return { error: 'Failed to fetch leaderboard data' };

        // Group by user and sum amounts
        const leaderboard: { [key: string]: { totalAmount: number; count: number } } = {};
        (salesOrders || []).forEach((order: any) => {
            if (!leaderboard[order.user_id]) {
                leaderboard[order.user_id] = { totalAmount: 0, count: 0 };
            }
            leaderboard[order.user_id].totalAmount += order.total_amount || 0;
            leaderboard[order.user_id].count += 1;
        });

        return { data: leaderboard, success: true };
    } catch (error: any) {
        return { error: `Failed to get leaderboard data: ${error.message}` };
    }
}
