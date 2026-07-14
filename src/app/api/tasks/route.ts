import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCtx, loadPerms } from "@/lib/session";
import { requirePermission, ForbiddenError } from "@/lib/rbac";

function fail(e: unknown) {
  const status = (e as { status?: number }).status ?? (e instanceof ForbiddenError ? 403 : 500);
  return NextResponse.json({ error: (e as Error).message }, { status });
}

// GET /api/tasks —— 本所待辦任務
export async function GET(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "工作流", await loadPerms(ctx.firmId));
    const rows = await prisma.task.findMany({
      where: { case: { firmId: ctx.firmId } },
      orderBy: [{ done: "asc" }, { dueDate: "asc" }],
      include: { case: { select: { id: true, title: true } }, assignee: { select: { id: true, name: true } } },
    });
    return NextResponse.json(rows);
  } catch (e) { return fail(e); }
}

// POST /api/tasks —— 指派任務
export async function POST(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "工作流", await loadPerms(ctx.firmId));
    const b = await req.json();
    const c = await prisma.case.findFirst({ where: { id: b.caseId, firmId: ctx.firmId } });
    if (!c) throw Object.assign(new Error("案件不存在或不屬本所"), { status: 404 });
    const created = await prisma.task.create({
      data: {
        caseId: b.caseId,
        title: b.title,
        assigneeId: b.assigneeId ?? null,
        dueDate: b.dueDate ? new Date(b.dueDate) : null,
        done: !!b.done,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) { return fail(e); }
}

// PATCH /api/tasks —— 更新（勾選完成／改期）
export async function PATCH(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "工作流", await loadPerms(ctx.firmId));
    const b = await req.json();
    const t = await prisma.task.findFirst({ where: { id: b.id, case: { firmId: ctx.firmId } } });
    if (!t) throw Object.assign(new Error("任務不存在"), { status: 404 });
    const updated = await prisma.task.update({
      where: { id: b.id },
      data: {
        ...(b.done !== undefined ? { done: !!b.done } : {}),
        ...(b.title !== undefined ? { title: b.title } : {}),
        ...(b.dueDate !== undefined ? { dueDate: b.dueDate ? new Date(b.dueDate) : null } : {}),
        ...(b.assigneeId !== undefined ? { assigneeId: b.assigneeId } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (e) { return fail(e); }
}
