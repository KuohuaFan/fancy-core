import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCtx, loadPerms } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";

// POST /api/notice  { caseId?, from, to, kind, facts }
export async function POST(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "存證信函", await loadPerms(ctx.firmId));
    const b = await req.json();
    const model = process.env.LLM_MODEL ?? "claude-sonnet-4-6";
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "尚未設定事務所 AI 金鑰" }, { status: 501 });

    const prompt =
      `依台灣郵局存證信函格式，草擬主題「${b.kind}」之存證信函：含寄件人/收件人/副本欄、主旨、分項說明（引用民法條號與催告期間）、結尾「此致…台照」與具名日期。` +
      `寄件人：${b.from ?? ""}；收件人：${b.to ?? ""}；事實：${b.facts ?? ""}。只輸出信函本文。`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 1500, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return NextResponse.json({ error: `AI 服務錯誤 ${r.status}` }, { status: 502 });
    const data = await r.json();
    const content: string = (data.content ?? [])
      .filter((x: { type: string }) => x.type === "text").map((x: { text: string }) => x.text).join("\n").trim();

    const saved = await prisma.notice.create({
      data: { caseId: b.caseId ?? null, kind: b.kind, content, model },
    });
    return NextResponse.json({ id: saved.id, content, model });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
