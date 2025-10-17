import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '../../../../lib/firebase/firebase-admin';

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

  const { uid, orgId, roles } = body || {};
  if (!uid || !orgId) {
    return NextResponse.json({ error: 'missing uid or orgId' }, { status: 400 });
  }

  try {
    const admin = getFirebaseAdmin();
    const roleArray = Array.isArray(roles) ? roles : (typeof roles === 'string' ? roles.split(',').map((s:string)=>s.trim()).filter(Boolean) : []);
    await admin.auth.setCustomUserClaims(uid, { orgId, roleIds: roleArray });
    return NextResponse.json({ ok: true, uid, orgId, roleIds: roleArray });
  } catch (err: any) {
    return NextResponse.json({ error: 'failed', detail: String(err) }, { status: 500 });
  }
}
