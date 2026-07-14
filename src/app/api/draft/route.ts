import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCtx, loadPerms } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";

// POST /api/draft  { caseId }
// Fancy AI：伺服器端持金鑰呼叫，前端永遠拿不到 key；產出寫入 Draft 供追溯（AI基本法）。
export async function POST(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "寫書狀", await loadPerms(ctx.firmId));

    const { caseId } = await req.json();
    const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId } });
    if (!c) return NextResponse.json({ error: "案件不存在" }, { status: 404 });

    const model = process.env.LLM_MODEL ?? "claude-sonnet-4-6";
    const apiKey = process.env.ANTHROPIC_API_KEY; // 所級自帶金鑰（BYO Key）
    if (!apiKey) return NextResponse.json({ error: "尚未設定事務所 AI 金鑰" }, { status: 501 });

    const prompt =
      `你是台灣資深民事／家事律師。請依卷證事實草擬「民事準備書狀」初稿，含聲明、事實與理由（標註民法條號）、爭點、證據。` +
      `案由：${c.type}。當事人：${c.client}／${c.opponent ?? "—"}。案號：${c.caseNo ?? "—"}。事實：${c.facts ?? ""}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 1500, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return NextResponse.json({ error: `AI 服務錯誤 ${r.status}` }, { status: 502 });

    const data = await r.json();
    const content: string = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text).join("\n").trim();

    const saved = await prisma.draft.create({
      data: { caseId: c.id, kind: "民事準備書狀", content, model, createdBy: ctx.userId },
    });

    return NextResponse.json({ id: saved.id, content, model });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
