import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionsForUser, revokeSession } from "@/lib/mock-sessions";
import { getCurrentUser } from "@/lib/firebase/firestore";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Only admin role can access
  if (!user.roleIds?.includes("admin"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sessions = await getSessionsForUser(user.id);
  // Mark which session belongs to the current caller (read cookie)
  const currentSessionId = req.cookies.get("sessionId")?.value || null;
  return NextResponse.json({ sessions, currentSessionId });
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.roleIds?.includes("admin"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const ok = await revokeSession(id);
    return NextResponse.json({ success: ok });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
