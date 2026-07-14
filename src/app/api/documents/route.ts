import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCtx, loadPerms } from "@/lib/session";
import { requirePermission, ForbiddenError } from "@/lib/rbac";

function fail(e: unknown) {
  const status = (e as { status?: number }).status ?? (e instanceof ForbiddenError ? 403 : 500);
  return NextResponse.json({ error: (e as Error).message }, { status });
}

// GET /api/documents?caseId=xxx —— 卷證清單
export async function GET(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "查卷證", await loadPerms(ctx.firmId));
    const caseId = new URL(req.url).searchParams.get("caseId");
    const rows = await prisma.document.findMany({
      where: { case: { firmId: ctx.firmId }, ...(caseId ? { caseId } : {}) },
      orderBy: { uploaded: "desc" },
    });
    return NextResponse.json(rows);
  } catch (e) { return fail(e); }
}

// POST /api/documents —— 登錄卷證（檔案本體另存物件儲存，此處存 metadata 與 key）
export async function POST(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "查卷證", await loadPerms(ctx.firmId));
    const b = await req.json();
    const c = await prisma.case.findFirst({ where: { id: b.caseId, firmId: ctx.firmId } });
    if (!c) throw Object.assign(new Error("案件不存在或不屬本所"), { status: 404 });
    const created = await prisma.document.create({
      data: {
        caseId: b.caseId,
        name: b.name,
        folder: b.folder ?? "07_其他資料",
        size: Number(b.size ?? 0),
        storeKey: b.storeKey ?? b.storageKey ?? null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) { return fail(e); }
}
