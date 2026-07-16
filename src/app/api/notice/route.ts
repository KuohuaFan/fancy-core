import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/llm";
import { getCtx, loadPerms } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";

// POST /api/notice  { caseId?, from, to, kind, facts, provider?, model? }
export async function POST(req: Request) {
  try {
    const ctx = await getCtx(req);
    requirePermission(ctx.role, "存證信函", await loadPerms(ctx.firmId));
    const body = (await req.json()) as {
      caseId?: string;
      from?: string;
      to?: string;
      kind?: string;
      facts?: string;
      provider?: string;
      model?: string;
    };

    let verifiedCaseId: string | null = null;
    if (body.caseId) {
      const c = await prisma.case.findFirst({
        where: { id: body.caseId, firmId: ctx.firmId },
        select: { id: true },
      });
      if (!c) return NextResponse.json({ error: "案件不存在" }, { status: 404 });
      verifiedCaseId = c.id;
    }

    const prompt =
      `依台灣郵局存證信函格式，草擬主題「${body.kind ?? ""}」之存證信函：含寄件人/收件人/副本欄、主旨、分項說明（引用民法條號與催告期間）、結尾「此致…台照」與具名日期。` +
      `寄件人：${body.from ?? ""}；收件人：${body.to ?? ""}；事實：${body.facts ?? ""}。只輸出信函本文。`;

    const generated = await generateText({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1500,
      provider: body.provider,
      model: body.model,
    });

    const saved = await prisma.notice.create({
      data: {
        caseId: verifiedCaseId,
        kind: body.kind ?? "存證信函",
        content: generated.text,
        model: `${generated.provider}:${generated.model}`,
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
