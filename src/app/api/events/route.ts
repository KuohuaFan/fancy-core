import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCtx, loadPerms } from "@/lib/session";
import { requirePermission, ForbiddenError } from "@/lib/rbac";

function fail(e: unknown) {
  const status = (e as { status?: number }).status ?? (e instanceof ForbiddenError ? 403 : 500);
  return NextResponse.json({ error: (e as Error).message }, { status });
}

function dateValue(value: string, endOfDay = false) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  }
  return new Date(value);
}

function toApiEvent<T extends { type: string; startsAt: Date }>(row: T) {
  return { ...row, kind: row.type, date: row.startsAt };
}

// GET /api/events —— 行事曆（可帶 ?from=&to=）
export async function GET(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "行事曆", await loadPerms(ctx.firmId));
    const sp = new URL(req.url).searchParams;
    const from = sp.get("from"), to = sp.get("to");
    const rows = await prisma.calendarEvent.findMany({
      where: {
        firmId: ctx.firmId,
        ...(from || to ? {
          startsAt: {
            ...(from ? { gte: dateValue(from) } : {}),
            ...(to ? { lte: dateValue(to, true) } : {}),
          },
        } : {}),
      },
      orderBy: { startsAt: "asc" },
      include: { case: { select: { id: true, title: true } } },
    });
    return NextResponse.json(rows.map(toApiEvent));
  } catch (e) { return fail(e); }
}

// POST /api/events —— 新增期日（開庭／期限）
export async function POST(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "行事曆", await loadPerms(ctx.firmId));
    const b = await req.json();
    if (b.caseId) {
      const c = await prisma.case.findFirst({ where: { id: b.caseId, firmId: ctx.firmId } });
      if (!c) throw Object.assign(new Error("案件不存在或不屬本所"), { status: 404 });
    }
    const startsAt = new Date(b.startsAt ?? b.date);
    if (Number.isNaN(startsAt.getTime())) {
      throw Object.assign(new Error("日期格式錯誤"), { status: 400 });
    }
    const created = await prisma.calendarEvent.create({
      data: {
        firmId: ctx.firmId,
        caseId: b.caseId || null,
        title: b.title,
        type: b.type ?? b.kind ?? "開庭",
        startsAt,
      },
    });
    return NextResponse.json(toApiEvent(created), { status: 201 });
  } catch (e) { return fail(e); }
}

// DELETE /api/events?id=xxx
export async function DELETE(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "行事曆", await loadPerms(ctx.firmId));
    const id = new URL(req.url).searchParams.get("id");
    const row = await prisma.calendarEvent.findFirst({ where: { id: id ?? "", firmId: ctx.firmId } });
    if (!row) throw Object.assign(new Error("事件不存在"), { status: 404 });
    await prisma.calendarEvent.delete({ where: { id: row.id } });
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
