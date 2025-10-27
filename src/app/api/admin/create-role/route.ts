import { NextResponse } from "next/server";
import { upsertRoleInDb } from "../../../../lib/mock-data/firestore";

export async function POST(req: Request) {
  const secret =
    req.headers.get("x-admin-secret") || process.env.ADMIN_API_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "ADMIN_API_SECRET not configured" },
      { status: 500 }
    );
  const callerSecret = req.headers.get("x-admin-secret");
  if (!callerSecret || callerSecret !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { id, orgId, name, permissions } = body || {};
  if (!orgId || !name)
    return NextResponse.json(
      { error: "missing orgId or name" },
      { status: 400 }
    );

  try {
    const role = await upsertRoleInDb({ id, orgId, name, permissions });
    return NextResponse.json({ ok: true, role });
  } catch (err: any) {
    return NextResponse.json(
      { error: "failed", detail: String(err) },
      { status: 500 }
    );
  }
}

