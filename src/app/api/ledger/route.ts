import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCtx, loadPerms } from "@/lib/session";
import { requirePermission, ForbiddenError } from "@/lib/rbac";

function fail(e: unknown) {
  const status = (e as { status?: number }).status ?? (e instanceof ForbiddenError ? 403 : 500);
  return NextResponse.json({ error: (e as Error).message }, { status });
}

// GET /api/ledger —— 收發與代墊帳簿
export async function GET(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "收發文", await loadPerms(ctx.firmId));
    const rows = await prisma.ledgerEntry.findMany({
      where: { firmId: ctx.firmId },
      orderBy: { date: "desc" },
      include: { case: { select: { id: true, title: true } } },
    });
    return NextResponse.json(rows);
  } catch (e) { return fail(e); }
}

// POST /api/ledger —— 記一筆（收文／發文／代墊／雜費；掃描建檔亦走此路由）
export async function POST(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "收發文", await loadPerms(ctx.firmId));
    const b = await req.json();
    if (b.caseId) {
      const c = await prisma.case.findFirst({ where: { id: b.caseId, firmId: ctx.firmId } });
      if (!c) throw Object.assign(new Error("案件不存在或不屬本所"), { status: 404 });
    }
    const created = await prisma.ledgerEntry.create({
      data: {
        firmId: ctx.firmId,
        caseId: b.caseId || null,
        kind: b.kind ?? "代墊",
        desc: b.desc ?? "",
        amount: Number(b.amount ?? 0),
        date: b.date ? new Date(b.date) : new Date(),
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) { return fail(e); }
}

// DELETE /api/ledger?id=xxx
export async function DELETE(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "收發文", await loadPerms(ctx.firmId));
    const id = new URL(req.url).searchParams.get("id");
    const row = await prisma.ledgerEntry.findFirst({ where: { id: id ?? "", firmId: ctx.firmId } });
    if (!row) throw Object.assign(new Error("紀錄不存在"), { status: 404 });
    await prisma.ledgerEntry.delete({ where: { id: row.id } });
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
