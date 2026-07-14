import { NextResponse } from "next/server";
import { getCtx, loadPerms } from "@/lib/session";
import { FEATURES, hasPermission } from "@/lib/rbac";

function fail(error: unknown) {
  const status = (error as { status?: number }).status ?? 500;
  return NextResponse.json({ error: (error as Error).message }, { status });
}

// GET /api/me/permissions —— 目前 session 的有效功能權限（唯讀）
export async function GET(req: Request) {
  try {
    const ctx = await getCtx(req);
    const overrides = await loadPerms(ctx.firmId);
    const features = Object.fromEntries(
      FEATURES.map((feature) => [feature, hasPermission(ctx.role, feature, overrides)]),
    );
    return NextResponse.json({ role: ctx.role, features });
  } catch (error) {
    return fail(error);
  }
}
