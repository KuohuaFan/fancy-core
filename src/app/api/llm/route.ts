import { NextResponse } from "next/server";
import { generateText, LLMError, type LLMMessage } from "@/lib/llm";
import { getCtx } from "@/lib/session";

// POST /api/llm —— Claude／Gemini／OpenAI／Mistral 共用伺服器端代理。
// 自建部署時，前端一律呼叫這裡；供應商金鑰只存在伺服器環境，永不回傳至瀏覽器。
export async function POST(req: Request) {
  try {
    await getCtx(req);
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 401 });
  }

  try {
    const body = (await req.json()) as {
      messages?: LLMMessage[];
      system?: unknown;
      max_tokens?: unknown;
      provider?: unknown;
      model?: unknown;
    };

    const requested = Number(body.max_tokens ?? 1200);
    const result = await generateText({
      messages: body.messages ?? [],
      system: typeof body.system === "string" ? body.system : undefined,
      maxTokens: Number.isFinite(requested) ? requested : 1200,
      provider: typeof body.provider === "string" ? body.provider : undefined,
      model: typeof body.model === "string" ? body.model : undefined,
    });

    // 保持既有單檔版與外掛可讀取的 Anthropic-style content，同時標明實際供應商與模型。
    return NextResponse.json({
      content: [{ type: "text", text: result.text }],
      provider: result.provider,
      model: result.model,
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    const status = e instanceof LLMError ? e.status : err.status ?? 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
