import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { SuggestKpisBasedOnPerformanceInput } from '@/ai/flows/suggest-kpis-based-on-performance';

// Import server-only implementation
import { suggestKpis } from '@/app/dashboard/components/kpi-suggestions-action';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = body as SuggestKpisBasedOnPerformanceInput;
    const result = await suggestKpis(input);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/suggest-kpis', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

