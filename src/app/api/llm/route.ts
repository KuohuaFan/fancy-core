import { NextResponse } from "next/server";
import { getCtx } from "@/lib/session";

// POST /api/llm —— 伺服器端 LLM 代理
// 自建部署時，前端一律呼叫這裡；金鑰只存在伺服器環境，永不回傳至瀏覽器。
export async function POST(req: Request) {
  try {
    await getCtx(req);
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "伺服器未設定 ANTHROPIC_API_KEY" }, { status: 501 });
  }

  try {
    const body = (await req.json()) as {
      messages?: unknown;
      system?: unknown;
      max_tokens?: unknown;
    };
    if (!Array.isArray(body.messages)) {
      return NextResponse.json({ error: "messages 必須為陣列" }, { status: 400 });
    }

    const requested = Number(body.max_tokens ?? 1200);
    const maxTokens = Number.isFinite(requested)
      ? Math.max(1, Math.min(1200, Math.floor(requested)))
      : 1200;

    const payload: Record<string, unknown> = {
      model: process.env.LLM_MODEL ?? "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: body.messages,
    };
    if (typeof body.system === "string") payload.system = body.system;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
