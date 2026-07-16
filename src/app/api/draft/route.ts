import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/llm";
import { getCtx, loadPerms } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";

// POST /api/draft  { caseId, provider?, model? }
// Fancy AI：伺服器端持金鑰呼叫，前端永遠拿不到 key；產出寫入 Draft 供追溯。
export async function POST(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "寫書狀", await loadPerms(ctx.firmId));

    const body = (await req.json()) as { caseId?: string; provider?: string; model?: string };
    const c = await prisma.case.findFirst({ where: { id: body.caseId, firmId: ctx.firmId } });
    if (!c) return NextResponse.json({ error: "案件不存在" }, { status: 404 });

    const prompt =
      `你是台灣資深民事／家事律師。請依卷證事實草擬「民事準備書狀」初稿，含聲明、事實與理由（標註民法條號）、爭點、證據。` +
      `案由：${c.type}。當事人：${c.client}／${c.opponent ?? "—"}。案號：${c.caseNo ?? "—"}。事實：${c.facts ?? ""}`;

    const generated = await generateText({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1500,
      provider: body.provider,
      model: body.model,
    });

    const auditModel = `${generated.provider}:${generated.model}`;
    const saved = await prisma.draft.create({
      data: {
        caseId: c.id,
        kind: "民事準備書狀",
        content: generated.text,
        model: auditModel,
        createdBy: ctx.userId,
      },
    });

    return NextResponse.json({
      id: saved.id,
      content: generated.text,
      provider: generated.provider,
      model: generated.model,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
