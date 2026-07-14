import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCtx, loadPerms } from "@/lib/session";
import { requirePermission, ForbiddenError } from "@/lib/rbac";

function fail(e: unknown) {
  const status = (e as { status?: number }).status ?? (e instanceof ForbiddenError ? 403 : 500);
  return NextResponse.json({ error: (e as Error).message }, { status });
}

// GET /api/cases —— 列出本所案件
export async function GET(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "存案件", await loadPerms(ctx.firmId));
    const cases = await prisma.case.findMany({
      where: { firmId: ctx.firmId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { tasks: true, documents: true } } },
    });
    return NextResponse.json(cases);
  } catch (e) { return fail(e); }
}

// POST /api/cases —— 新增案件
export async function POST(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "存案件", await loadPerms(ctx.firmId));
    const b = await req.json();
    const created = await prisma.case.create({
      data: {
        firmId: ctx.firmId,
        title: b.title,
        type: b.type ?? "其他",
        status: b.status ?? "進行中",
        client: b.client ?? "—",
        opponent: b.opponent ?? null,
        court: b.court ?? null,
        caseNo: b.caseNo ?? null,
        facts: b.facts ?? null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) { return fail(e); }
}
