import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCtx, loadPerms } from "@/lib/session";
import { requirePermission, ForbiddenError } from "@/lib/rbac";

function fail(e: unknown) {
  const status = (e as { status?: number }).status ?? (e instanceof ForbiddenError ? 403 : 500);
  return NextResponse.json({ error: (e as Error).message }, { status });
}
import { LOCKED_ROLES, type Role } from "@/lib/rbac";

// GET /api/permissions —— 權限矩陣（功能 × 角色）
export async function GET(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "分層權限", await loadPerms(ctx.firmId));
    return NextResponse.json(await loadPerms(ctx.firmId));
  } catch (e) { return fail(e); }
}

// PATCH /api/permissions —— 所長調整某功能對某角色的授權
export async function PATCH(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "分層權限", await loadPerms(ctx.firmId));
    const b = (await req.json()) as { feature: string; role: string; allowed: boolean };
    if (LOCKED_ROLES.includes(b.role as Role)) {
      throw Object.assign(new Error("所長／管理員為最高權限，不可移除"), { status: 400 });
    }
    const row = await prisma.permission.upsert({
      where: { firmId_feature_role: { firmId: ctx.firmId, feature: b.feature, role: b.role } },
      update: { allowed: b.allowed },
      create: { firmId: ctx.firmId, feature: b.feature, role: b.role, allowed: b.allowed },
    });
    return NextResponse.json(row);
  } catch (e) { return fail(e); }
}
