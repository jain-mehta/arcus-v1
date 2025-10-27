import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/client';

// POST /api/admin/set-claims
export async function POST(req: Request) {
  const secret = req.headers.get('x-admin-secret') || process.env.ADMIN_API_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'ADMIN_API_SECRET not configured' }, { status: 500 });
  }

  // Basic header-based protection. Caller must include header 'x-admin-secret'
  const callerSecret = req.headers.get('x-admin-secret');
  if (!callerSecret || callerSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { userId, roles } = body || {};
  if (!userId) {
    return NextResponse.json({ error: 'missing userId' }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseServerClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const roleArray = Array.isArray(roles) ? roles : (typeof roles === 'string' ? roles.split(',').map((s:string)=>s.trim()).filter(Boolean) : []);
    
    // Update user role in database
    const { error } = await supabaseAdmin
      .from('users')
      .update({ role_ids: roleArray })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: 'failed', detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, userId, roleIds: roleArray });
  } catch (err: any) {
    return NextResponse.json({ error: 'failed', detail: String(err) }, { status: 500 });
  }
}

